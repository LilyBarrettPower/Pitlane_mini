// Verifies the JWT on each request, then checks the user still has access
// and attaches req.user = { userId, organisationId, role }.

const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }

    try {
        // Look the user up so removed users are locked out straight away
        // (their token would otherwise stay valid for up to 24 hours), and so
        // the role always reflects what's in the database.
        const user = await User.findById(decoded.userId).select("organisationId role isActive");

        if (!user || !user.isActive) {
            return res.status(401).json({ message: "Your access to this organisation has been removed" });
        }

        req.user = {
            userId: String(user._id),
            organisationId: String(user.organisationId),
            role: user.role,
        };

        next();
    } catch (err) {
        console.error("Auth middleware error:", err.message);
        return res.status(500).json({ message: "Server error" });
    }
}

module.exports = authMiddleware;
