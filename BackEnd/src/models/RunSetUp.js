const mongoose = require('mongoose');

const RunSetUpSchema = new mongoose.Schema(
    {
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organisation',
            required: true,
        },
        runId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Run',
            required: true,
        },
        setUpId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SetUp',
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

EventVehicleSchema.index(
    { organisationId: 1, runId: 1, setUpId: 1 },
    { unique: true }
);

module.exports = mongoose.model('Run SetUp', RunSetUpSchema);