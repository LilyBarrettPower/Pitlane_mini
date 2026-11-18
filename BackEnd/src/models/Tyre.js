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
        fiaSerial: { type: String, trim: true },
        condition: { type: String, enum: ["New", "Used"], required: true }, // Should make it so that when this is "New" km total initially is 0
        heatCycles: { type: Number, default: 0, min: 0 },
        kmTotal: { type: Number, default: 0, min: 0 },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

// FIA serials must be unique within an organisation, but only when one is entered.
// (A "sparse" index doesn't work here: empty strings, and compound keys that
// include organisationId, still get indexed - so tyres without a serial clashed.)
TyreSchema.index(
    { organisationId: 1, fiaSerial: 1 },
    { unique: true, partialFilterExpression: { fiaSerial: { $gt: "" } } }
);

TyreSchema.pre("validate", function () {
    if (this.kmTotal > 0) {
        this.condition = "Used";
    }
    if (this.condition === "New") {
        this.kmTotal = 0;
    }
});

module.exports = mongoose.model("Tyre", TyreSchema);