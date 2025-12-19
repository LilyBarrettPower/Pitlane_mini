const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
    {
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organisation',
            required: true,
        },
        trackId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Track',
            required: false, // Change this once testing is complete to true
        },
        name: { type: String, required: true },
        type: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        status: {type: String, default: 'upcoming'},
        notes: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Event', EventSchema);
