const mongoose = require("mongoose");

const EventVehicleSchema = new mongoose.Schema(
    {
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organisation",
            required: true,
        },
        vehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: true,
        },
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },
        type: {
            type: String,
            default: "",
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

EventVehicleSchema.index(
    { organisationId: 1, vehicleId: 1, eventId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Event Vehicle", EventVehicleSchema);