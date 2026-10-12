const mongoose = require("mongoose");

const TyreNoteSchema = new mongoose.Schema(
    {
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organisation",
            required: true,
        },
        tyreId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tyre",
            required: true,
        },
        runId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Run",
            required: true,
        },
        corner: {
            type: String,
            enum: ["LF", "RF", "LR", "RR"],
            required: true,
        },
        category: {
            type: String,
            enum: [
                "General",
                "Puncture",
                "Flat Spot",
                "Damage",
                "Wear",
                "Other",
            ],
            default: "General",
        },
        note: {
            type: String,
            required: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {timestamps: true}
);

TyreNoteSchema.index({
    organisationId: 1,
    tyreId: 1,
    createdAt: -1,
});

TyreNoteSchema.index({
    organisationId: 1,
    runId: 1,
});

module.exports = mongoose.model("TyreNote", TyreNoteSchema);