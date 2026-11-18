// One-time tokens for invite and password reset links.
// The raw token only ever goes in the email; the database stores a SHA-256
// hash, so someone reading the database can't use the links.

const crypto = require("crypto");

function hashToken(token) {
    return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function createToken() {
    const token = crypto.randomBytes(32).toString("hex");
    return { token, hash: hashToken(token) };
}

module.exports = { createToken, hashToken };
