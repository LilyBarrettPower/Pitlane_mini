const mongoose = require("mongoose");

const IssueSchema = new mongoose.Schema(
    {
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organisation",
            required: true,
        },
        eventVehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "EventVehicle",
            required: true, 
        },
        area: { type: String, required: true, trim: true },
        symptoms: { type: String, required: true, trim: true },
        severity: { type: String, required: true, trim: true }, // "Low", "Medium", "High"
        cause: { type: String, default: "", trim: true },
        fix: { type: String, default: "", trim: true },
        status: { type: String, default: "open" },
        reportedAt: {type: Date, default: Date.now},
        notes: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

IssueSchema.index({ organisationId: 1, eventVehicleId: 1, isActive: 1 });
IssueSchema.index({ organisationId: 1, status: 1, isActive: 1 });

module.exports = mongoose.model("Issue", IssueSchema);