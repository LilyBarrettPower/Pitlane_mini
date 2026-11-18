const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Organisation = require("../models/Organisation");
const User = require("../models/User");
const { createToken: createLinkToken, hashToken } = require("../utils/tokens");
const { sendInviteEmail, sendPasswordResetEmail } = require("../utils/mailer");

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;
const INVITE_EXPIRY_MS = 72 * 60 * 60 * 1000; // 72 hours
const RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const ALLOWED_ROLES = ["admin", "engineer", "mechanic", "viewer"];

function createToken(user) {
    return jwt.sign(
        {
            userId: user._id.toString(),
            organisationId:
                user.organisationId && user.organisationId._id
                    ? user.organisationId._id.toString()
                    : user.organisationId.toString(),
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24hr" }
    );
}

// Same shape as the login response, so the app can log the user straight in
async function loginResponse(user) {
    const organisation = await Organisation.findById(user.organisationId);

    return {
        token: createToken(user),
        user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
        organisation: {
            id: organisation?._id,
            name: organisation?.name,
        },
    };
}

function getOrganisationId(req) {
    return req.user.organisationId && req.user.organisationId._id
        ? req.user.organisationId._id
        : req.user.organisationId;
}

function passwordProblem(password) {
    if (!password || String(password).length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    return null;
}

// Public fields of a user for the users list (never hashes or tokens)
function publicUser(user) {
    return {
        id: user._id,
        organisationId: user.organisationId,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status || "active",
        createdAt: user.createdAt,
    };
}

// POST - register a new organisation; the person registering becomes its admin
exports.registerOrganisation = async (req, res) => {
    try {
        const { orgName, name, email, password } = req.body;

        if (!orgName || !email || !password) {
            return res
                .status(400)
                .json({ message: "Organisation name, email and password are required" });
        }

        const problem = passwordProblem(password);
        if (problem) {
            return res.status(400).json({ message: problem });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res
                .status(400)
                .json({ message: "User with this email already exists" });
        }

        const organisation = await Organisation.create({ name: orgName });
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await User.create({
            organisationId: organisation._id,
            email: email.toLowerCase(),
            passwordHash,
            name,
            role: "admin",
            status: "active",
        });

        res.status(201).json({
            token: createToken(user),
            user: {
                id: user._id,
                organisationId: user.organisationId,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            organisation: {
                id: organisation._id,
                name: organisation.name,
            },
        });
    } catch (err) {
        console.error("register Organisation error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST - log in
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).populate(
            "organisationId",
            "name"
        );
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Invited users haven't chosen a password yet
        if (user.status === "invited" || !user.passwordHash) {
            return res.status(403).json({
                message: "Please use the link in your invite email to set your password first",
            });
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        res.json({
            token: createToken(user),
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            organisation: {
                id: user.organisationId._id,
                name: user.organisationId.name,
            },
        });
    } catch (err) {
        console.error("login error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET - the logged in user
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-passwordHash");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ user });
    } catch (err) {
        console.error("getMe error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Creates a fresh invite link for a user, saves its hash and emails it
async function issueInvite(user, inviter) {
    const { token, hash } = createLinkToken();

    user.inviteTokenHash = hash;
    user.inviteExpiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);
    await user.save();

    const organisation = await Organisation.findById(user.organisationId);

    await sendInviteEmail({
        to: user.email,
        inviteeName: user.name,
        inviterName: inviter?.name || inviter?.email,
        organisationName: organisation?.name || "your team",
        token,
    });
}

// POST - admin invites a new user by email; they set their own password
exports.inviteUser = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can invite users" });
        }

        const { name, email, role } = req.body;

        if (!email || !String(email).includes("@")) {
            return res.status(400).json({ message: "A valid email is required" });
        }

        if (role && !ALLOWED_ROLES.includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const organisationId = getOrganisationId(req);
        const normalisedEmail = String(email).trim().toLowerCase();

        const existingUser = await User.findOne({ email: normalisedEmail });
        if (existingUser) {
            const sameOrgInvite =
                String(existingUser.organisationId) === String(organisationId) &&
                existingUser.status === "invited";

            return res.status(400).json({
                message: sameOrgInvite
                    ? "This person has already been invited - use Resend invite instead"
                    : "A user with this email already exists",
            });
        }

        const user = await User.create({
            organisationId,
            email: normalisedEmail,
            name: name || "",
            role: role || "viewer",
            status: "invited",
            invitedBy: req.user.userId,
        });

        const inviter = await User.findById(req.user.userId);

        try {
            await issueInvite(user, inviter);
        } catch (mailErr) {
            console.error("Invite email failed", mailErr);
            return res.status(201).json({
                user: publicUser(user),
                warning: "User created, but the invite email could not be sent. Try Resend invite.",
            });
        }

        res.status(201).json({ user: publicUser(user) });
    } catch (err) {
        console.error("inviteUser error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST - admin resends an invite (the previous link stops working)
exports.resendInvite = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can resend invites" });
        }

        const user = await User.findOne({
            _id: req.params.userId,
            organisationId: getOrganisationId(req),
            isActive: true,
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.status !== "invited") {
            return res.status(400).json({ message: "This user has already set up their account" });
        }

        const inviter = await User.findById(req.user.userId);
        await issueInvite(user, inviter);

        res.json({ message: "Invite sent" });
    } catch (err) {
        console.error("resendInvite error", err);
        res.status(500).json({ message: "Could not send the invite email" });
    }
};

// Finds the invited user for a valid, unexpired invite token
async function findUserByInviteToken(token) {
    if (!token) return null;

    return User.findOne({
        inviteTokenHash: hashToken(token),
        inviteExpiresAt: { $gt: new Date() },
        status: "invited",
        isActive: true,
    }).select("+inviteTokenHash +inviteExpiresAt");
}

// GET - check an invite link and return details for the setup page
exports.verifyInvite = async (req, res) => {
    try {
        const user = await findUserByInviteToken(req.query.token);

        if (!user) {
            return res.status(400).json({
                message: "This invite link is invalid or has expired. Ask your admin to resend it.",
            });
        }

        const organisation = await Organisation.findById(user.organisationId);

        res.json({
            email: user.email,
            name: user.name,
            organisationName: organisation?.name,
        });
    } catch (err) {
        console.error("verifyInvite error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST - invited user sets their password; logs them in
exports.acceptInvite = async (req, res) => {
    try {
        const { token, password, name } = req.body;

        const problem = passwordProblem(password);
        if (problem) {
            return res.status(400).json({ message: problem });
        }

        const user = await findUserByInviteToken(token);

        if (!user) {
            return res.status(400).json({
                message: "This invite link is invalid or has expired. Ask your admin to resend it.",
            });
        }

        user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        user.status = "active";
        if (name && String(name).trim()) user.name = String(name).trim();
        user.inviteTokenHash = undefined;
        user.inviteExpiresAt = undefined;
        await user.save();

        res.json(await loginResponse(user));
    } catch (err) {
        console.error("acceptInvite error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST - send a password reset link. Always gives the same reply, so the
// form can't be used to find out which emails have accounts.
exports.forgotPassword = async (req, res) => {
    const reply = {
        message: "If an account exists for that email, we've sent a link to reset the password.",
    };

    try {
        const email = String(req.body.email || "").trim().toLowerCase();
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email, isActive: true });

        // Invited users should use their invite link instead
        if (user && user.status !== "invited" && user.passwordHash) {
            const { token, hash } = createLinkToken();

            user.resetTokenHash = hash;
            user.resetExpiresAt = new Date(Date.now() + RESET_EXPIRY_MS);
            await user.save();

            try {
                await sendPasswordResetEmail({ to: user.email, name: user.name, token });
            } catch (mailErr) {
                console.error("Password reset email failed", mailErr);
            }
        }

        res.json(reply);
    } catch (err) {
        console.error("forgotPassword error", err);
        res.json(reply);
    }
};

// POST - set a new password using a reset link; logs the user in
exports.resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        const problem = passwordProblem(password);
        if (problem) {
            return res.status(400).json({ message: problem });
        }

        const user = token
            ? await User.findOne({
                resetTokenHash: hashToken(token),
                resetExpiresAt: { $gt: new Date() },
                isActive: true,
            }).select("+resetTokenHash +resetExpiresAt")
            : null;

        if (!user) {
            return res.status(400).json({
                message: "This reset link is invalid or has expired. Please request a new one.",
            });
        }

        user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        user.resetTokenHash = undefined;
        user.resetExpiresAt = undefined;
        await user.save();

        res.json(await loginResponse(user));
    } catch (err) {
        console.error("resetPassword error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET - all users in the logged in user's organisation
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({
            organisationId: getOrganisationId(req),
            isActive: true,
        }).sort({ createdAt: -1 });

        res.json({ users: users.map(publicUser) });
    } catch (err) {
        console.error("getUsers error", err);
        res.status(500).json({ message: "Server error" });
    }
};
