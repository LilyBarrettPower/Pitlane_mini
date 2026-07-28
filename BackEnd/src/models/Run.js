const mongoose = require("mongoose");

const RunSchema = new mongoose.Schema(
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
        name: { type: String, default: "", trim: true },
        weather: { type: String, trim: true },
        trackTemp: { type: String, trim: true },
        trackCondition: {type: String, trim: true}, 
        outTime: {type: Date},
        inTime: {type: Date},
        lapsDone: {type: Number},
        fuelStart: { type: Number},
        fuelEnd: { type: Number},
        fuelUsed: { type: Number},
        fuelPerLap: { type: Number},
        averageLapS: {type: Number},
        bestLapS: {type: Number},
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);



module.exports = mongoose.model("Run", RunSchema);