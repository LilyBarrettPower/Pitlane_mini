const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Organisation = require('../models/Organisation');
const User = require('../models/User');
// Make everything required available in this file 

const SALT_ROUNDS = 10;

function createToken(user) {
    return jwt.sign(
        {
            userId: user._id.toString(),
            organisationId: user.organisationId.toStrong(),
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: '1hr' }
    );
}

// POST to register a new organisation:
exports.registerOrganisation = async (req, res) => {
    try {
        const { orgName, name, email, password } = req.body;

        if (!orgName || !email || !password) {
            return res
                .status(400)
                .json({ message: 'Organisation name, email and password are required' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res
                .status(400)
                .json({ message: 'User with this email already exists' });
        }
        const organisation = await Organisation.create({ name: orgName });
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const user = await User.create({
            organisationId: organisation._id,
            email: email.toLowerCase(),
            passwordHash,
            name: name,
            role: 'admin',
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
        console.error('register Organisation error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// POST authentication - login 

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
        if (!user) {
            return res
                .status(401)
                .json({ message: 'Invalid email or password' });
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res
                .status(401)
                .json({ message: 'Invalid email or password' });
        }

        const token = createToken(user);

        res.json({
            token,
            user: {
                id: user._id,
                organisationId: user.organisationId,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (err) {
        console.error('login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET returning the logged in user 

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-passwordHash');
        if (!user) {
            return res
                .status(404)
                .json({ message: 'User not found' });
        }
        res.json({ user });
    } catch (err) {
        console.error('getMe error', err);
        res.status(500).json({ message: 'Server error' });
    }
};


