const mongoose = require("mongoose");

const LapTimeSchema = new mongoose.Schema(
    {
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organisation",
            required: true,
        },

        runId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Run",
            required: true,
        },
        lapNumber: {
            type: Number,
            required: true,
        },
        lapTimeS: {
            type: Number,
            required: true,
        },
        fuelRemaining: {
            type: Number,
            default: undefined,
        },
        trackStatus: {
            type: String, 
            default: "",
            trim: true,
        },
        isInLap: {
            type: Boolean, 
            default: false,
        },
        isOutLap: {
            type: Boolean,
            default: false,
        },
        notes: {
            type: String, 
            default: "",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
     {timestamps: true}
);

LapTimeSchema.pre("validate", function (next) {
    if (this.isInLap && this.isOutLap) {
        return next(
            new Error(
                "A lap cannot be both an in lap and an out lap"
            )
        );
    }

    next();
});


LapTimeSchema.index(
    {organisationId: 1, runId: 1, lapNumber: 1},
    {unique: true}
);

module.exports = mongoose.model("LapTime", LapTimeSchema);