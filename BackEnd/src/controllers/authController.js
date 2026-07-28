const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Organisation = require("../models/Organisation");
const User = require("../models/User");
// Make everything required available in this file 

const SALT_ROUNDS = 10;


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
        { expiresIn: "1hr" }
    );
}

// POST to register a new organisation:
exports.registerOrganisation = async (req, res) => {
    try {
        const { orgName, name, email, password } = req.body;

        if (!orgName || !email || !password) {
            return res
                .status(400)
                .json({ message: "Organisation name, email and password are required" });
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
            name: name,
            role: "admin",
        });

        const token = createToken(user);
        res.status(201).json({
            token,
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

// POST authentication - login 

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase(), isActive: true }).populate("organisationId", "name");
        if (!user) {
            return res
                .status(401)
                .json({ message: "Invalid email or password" });
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res
                .status(401)
                .json({ message: "Invalid email or password" });
        }

        const token = createToken(user);

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
            organisation:{
                id: user.organisationId._id,
                name: user.organisationId.name,
            }
        });
    } catch (err) {
        console.error("login error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET returning the logged in user 

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-passwordHash");
        if (!user) {
            return res
                .status(404)
                .json({ message: "User not found" });
        }
        res.json({ user });
    } catch (err) {
        console.error("getMe error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Create new user 

exports.createUser = async (req, res) => {
    try {
        const currentUserRole = req.user.role;

        if (currentUserRole !== "admin") {
            return res.status(403).json({
                message: "Only admins can create users",
            });
        }

        const { name, email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const allowedRoles = ["admin", "engineer", "mechanic", "viewer"];

        if (role && !allowedRoles.includes(role)) {
            return res.status(400).json({
                message: "Invalid role",
            });
        }

        const existingUser = await User.findOne({
            email: email.toLowerCase(),
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists",
            });
        }

        // Handle either plain ObjectId string or populated object in token
        const organisationId =
            req.user.organisationId && req.user.organisationId._id
                ? req.user.organisationId._id
                : req.user.organisationId;

        const organisation = await Organisation.findById(organisationId);

        if (!organisation) {
            return res.status(404).json({
                message: "Organisation not found",
            });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await User.create({
            organisationId: organisation._id,
            email: email.toLowerCase(),
            passwordHash,
            name: name || "",
            role: role || "viewer",
        });

        res.status(201).json({
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
        console.error("createUser error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Return all users for the logged in organisation 

exports.getUsers = async (req, res) => {
    try {
        const organisationId =
            req.user.organisationId && req.user.organisationId._id
                ? req.user.organisationId._id
                : req.user.organisationId;

        const users = await User.find({
            organisationId,
            isActive: true,
        })
            .select("-passwordHash")
            .sort({ createdAt: -1 });

        res.json({ users });
    } catch (err) {
        console.error("getUsers error", err);
        res.status(500).json({ message: "Server error" });
    }
};

