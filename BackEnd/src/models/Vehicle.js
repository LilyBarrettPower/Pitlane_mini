const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema(
    {
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organisation",
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        racingNumber: {
            type: String,
            required: true,
        },
        make: { type: String },
        model: { type: String },
        year: { type: Number },
        owner: { type: String },
        ownerHistory: [
            {
                owner: String,
                changedAt: {type: Date, default: Date.now},
            }
        ],
        odo: {type: Number},
        chassisNumber: {type: String},
        notes: {type: String},
        // Extra fields this vehicle's setups can record. Every setup for the
        // vehicle shows them; values are stored on each setup (SetUp.customValues).
        setupFields: [
            {
                label: { type: String, required: true, trim: true, maxlength: 60 },
                unit: { type: String, trim: true, default: "", maxlength: 15 },
                // "frontRear" = front + rear values; "single" = one value;
                // "corners" = a value for each corner (LF, RF, LR, RR)
                kind: { type: String, enum: ["frontRear", "single", "corners"], default: "frontRear" },
                // Removing a field hides it but keeps values already entered
                isActive: { type: Boolean, default: true },
            },
        ],
        isActive: {type: Boolean, default: true},
    },
    {timestamps: true}
);

module.exports = mongoose.model("Vehicle", VehicleSchema);