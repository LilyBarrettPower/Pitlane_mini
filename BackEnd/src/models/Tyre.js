const mongoose = require("mongoose");

const TyreSchema = new mongoose.Schema(
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
        brand: { type: String, required: true, trim: true },
        spec: { type: String, trim: true },
        currentSet: {type: String}, // Maybe change this to an ID? 
        size: {type: String},
        position: {type: String},
        fiaSerial: { type: String, trim: true, unique: true, sparse: true},
        condition: { type: String, enum: ["New", "Used"], required: true }, // Should make it so that when this is "New" km total initially is 0
        heatCycles: { type: Number, default: 0, min: 0 },
        kmTotal: { type: Number, default: 0, min: 0 },
        notes: {
            type: String, default: ""
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

TyreSchema.index(
    { organisationId: 1, vehicleId: 1, fiaSerial: 1 },
    { unique: true, sparse: true }
)

module.exports = mongoose.model("Tyre", TyreSchema);