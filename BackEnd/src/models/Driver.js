const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema(
    {
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organisation',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        experience: {
            type: String,
            default: '',
            trim: true
        },
        notes: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Driver', DriverSchema);
