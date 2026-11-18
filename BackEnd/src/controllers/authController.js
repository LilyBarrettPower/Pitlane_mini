const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Organisation = require("../models/Organisation");
const User = require("../models/User");
const { createToken: createLinkToken, hashToken } = require("../utils/tokens");
const { sendInviteEmail, sendPasswordResetEmail } = require("../utils/mailer");
const { isValidEmail, normaliseEmail, passwordProblem } = require("../utils/validation");

const SALT_ROUNDS = 10;
const INVALID_EMAIL_MESSAGE = "Please enter a valid email address";
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

        if (!isValidEmail(email)) {
            return res.status(400).json({ message: INVALID_EMAIL_MESSAGE });
        }

        const problem = passwordProblem(password);
        if (problem) {
            return res.status(400).json({ message: problem });
        }

        const existingUser = await User.findOne({ email: normaliseEmail(email) });
        if (existingUser) {
            return res
                .status(400)
                .json({ message: "User with this email already exists" });
        }

        const organisation = await Organisation.create({ name: String(orgName).trim() });
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await User.create({
            organisationId: organisation._id,
            email: normaliseEmail(email),
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

        // Format check only - password rules aren't applied at login, so
        // older accounts with simpler passwords can still sign in
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: INVALID_EMAIL_MESSAGE });
        }

        const user = await User.findOne({ email: normaliseEmail(email), isActive: true }).populate(
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

        if (!isValidEmail(email)) {
            return res.status(400).json({ message: INVALID_EMAIL_MESSAGE });
        }

        if (role && !ALLOWED_ROLES.includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const organisationId = getOrganisationId(req);
        const normalisedEmail = normaliseEmail(email);

        const existingUser = await User.findOne({ email: normalisedEmail });
        const sameOrg = existingUser && String(existingUser.organisationId) === String(organisationId);

        // Someone previously removed from this organisation: bring their
        // account back as a fresh invite (they'll set a new password)
        const rejoining = sameOrg && !existingUser.isActive;

        if (existingUser && !rejoining) {
            const alreadyInvited = sameOrg && existingUser.status === "invited";

            return res.status(400).json({
                message: alreadyInvited
                    ? "This person has already been invited - use Resend invite instead"
                    : "A user with this email already exists",
            });
        }

        let user;

        if (rejoining) {
            user = existingUser;
            user.isActive = true;
            user.status = "invited";
            user.passwordHash = undefined;
            user.name = name || user.name || "";
            user.role = role || "viewer";
            user.invitedBy = req.user.userId;
            await user.save();
        } else {
            user = await User.create({
                organisationId,
                email: normalisedEmail,
                name: name || "",
                role: role || "viewer",
                status: "invited",
                invitedBy: req.user.userId,
            });
        }

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
        const email = normaliseEmail(req.body.email);
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: INVALID_EMAIL_MESSAGE });
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

// DELETE - admin removes a user from the organisation. The user is archived
// (not deleted) so anything they recorded stays; they lose access straight away.
exports.removeUser = async (req, res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({ message: "Only admins can remove users" });
        }

        const { userId } = req.params;
        const organisationId = getOrganisationId(req);

        if (String(userId) === String(req.user.userId)) {
            return res.status(400).json({ message: "You can't remove yourself" });
        }

        const user = await User.findOne({ _id: userId, organisationId, isActive: true }).select(
            "+inviteTokenHash +inviteExpiresAt +resetTokenHash +resetExpiresAt"
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Never leave the organisation without an admin
        if (user.role === "admin") {
            const otherAdmins = await User.countDocuments({
                organisationId,
                isActive: true,
                role: "admin",
                _id: { $ne: user._id },
            });

            if (otherAdmins === 0) {
                return res.status(400).json({ message: "You can't remove the last admin" });
            }
        }

        user.isActive = false;
        // Cancel any outstanding invite or password reset links
        user.inviteTokenHash = undefined;
        user.inviteExpiresAt = undefined;
        user.resetTokenHash = undefined;
        user.resetExpiresAt = undefined;
        await user.save();

        res.json({ message: "User removed", user: publicUser(user) });
    } catch (err) {
        console.error("removeUser error", err);
        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid user id" });
        }
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
