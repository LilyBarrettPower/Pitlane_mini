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
        email: {
            type: String,
            default: "",
        },
        phoneNumber: {
            type: String,
            default: "",
        },
        notes: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Driver', DriverSchema);
