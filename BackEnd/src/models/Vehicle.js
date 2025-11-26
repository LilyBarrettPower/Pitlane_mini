const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema(
    {
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organisation',
            require: true,
        },
        name: {
            type: String,
            required: true,
        },
        racingNumber: {
            type: String,
            required: true,
        },
        make: { type: String },
        model: { type: String },
        year: { type: String },
        owner: { type: String },
        previousOwner: { type: String },
    },
);

module.exports = mongoose.model('Vehicle', VehicleSchema);