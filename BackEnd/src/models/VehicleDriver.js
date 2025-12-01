const mongoose = require('mongoose');

const VehicleDriverSchema = new mongoose.Schema(
    {
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organisation',
            required: true,
        },
        vehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: true,
        },
        driverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Driver',
            required: true,
        },
        role: {
            type: String,
            default: '',
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

VehicleDriverSchema.index(
    { organisationId: 1, vehicleId: 1, driverId: 1 },
    { unique: true }
);

module.exports = mongoose.model('VehicleDriver', VehicleDriverSchema);
