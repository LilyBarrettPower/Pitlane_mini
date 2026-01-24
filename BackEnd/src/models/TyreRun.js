const mongoose = require('mongoose');

const TyreRunSchema = new mongoose.Schema(
    {
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organisation',
            required: true,
        },
        runId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Run',
            required: false, // Change this to true once Run has been completed
        },
        tyreId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tyre',
            required: true,
        },
        eventVehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'EventVehicle',
            required: true,
        },
        hotPsi: {
            LF: Number,
            RF: Number,
            LR: Number,
            RR: Number,
        },
        coldPsi: {
            LF: Number,
            RF: Number,
            LR: Number,
            RR: Number,
        },
        hotTempC: {
            LF: Number,
            RF: Number,
            LR: Number,
            RR: Number,
        },
        coldTempC: {
            LF: Number,
            RF: Number,
            LR: Number,
            RR: Number,
        },

        distanceKm: { type: Number, default: 0, min: 0 },
        heatCycleIncrement: { type: Number, default: 1 },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

TyreRunSchema.index({ organisationId: 1, runId: 1, tyreId: 1 });


module.exports = mongoose.model('TyreRun', TyreRunSchema);