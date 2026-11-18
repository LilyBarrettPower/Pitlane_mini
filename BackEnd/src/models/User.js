// Schema for user data used for authentication and personalisation

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        // Links the user to their organisation
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organisation",
            required: true,
        },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        // Empty until an invited user sets their password
        passwordHash: { type: String },
        name: { type: String },
        role: {
            type: String,
            enum: ["admin", "engineer", "mechanic", "viewer"],
            default: "engineer",
        },
        // "invited" = added by an admin but hasn't set a password yet.
        // Users created before invites existed have no value and count as active.
        status: {
            type: String,
            enum: ["invited", "active"],
            default: "active",
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        // One-time link tokens (SHA-256 hashes only, never the raw token).
        // select: false keeps them out of query results unless asked for.
        inviteTokenHash: { type: String, select: false },
        inviteExpiresAt: { type: Date, select: false },
        resetTokenHash: { type: String, select: false },
        resetExpiresAt: { type: Date, select: false },

        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

UserSchema.index({ inviteTokenHash: 1 }, { sparse: true });
UserSchema.index({ resetTokenHash: 1 }, { sparse: true });

module.exports = mongoose.model("User", UserSchema);
