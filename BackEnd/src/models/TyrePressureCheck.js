const mongoose = require("mongoose");

const cornerValuesSchema = new mongoose.Schema(
    {
        LF: {
            type: Number,
            min: 0,
        },
        RF: {
            type: Number,
            min: 0,
        },
        LR: {
            type: Number,
            min: 0,
        },
        RR: {
            type: Number,
            min: 0,
        },
    },
    {
        _id: false,
    }
);

const TyrePressureCheckSchema = new mongoose.Schema(
    {
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organisation",
            required: true,
        },
        tyreRunId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TyreRun",
            required: true,
        },
        stage: {
            type: String,
            enum: ["start", "mid", "end"],
            required: true,
        },
        pressurePsi: {
            type: cornerValuesSchema,
            required: true,
        },
        tyreTempC: {
            type: cornerValuesSchema,
            default: undefined,
        },
        rimTempC: {
            type: cornerValuesSchema,
            default: undefined,
        },
        // Make it so that this is Automatic
        lapNumber: {
            type: Number,
            min: 0,
            default: undefined,
        },
        recordedAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
        notes: {
            type: String,
            default: "",
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);


TyrePressureCheckSchema.index({
    organisationId: 1,
    tyreRunId: 1,
    stage: 1,
});

module.exports = mongoose.model(
    "TyrePressureCheck",
    TyrePressureCheckSchema
);