const mongoose = require('mongoose');

const ChecklistInstanceItemSchema = new mongoose.Schema(
    {
        label: {
            type: String,
            required: true,
            trim: true,
        },
        notes: {
            type: String,
            default: '',
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
        isRequired: {
            type: Boolean,
            default: true,
        },
        done: {
            type: Boolean,
            default: false,
        },
        answer: {
            type: String,
            default: '',
        },
        doneAt: {
            type: Date,
            default: null,
        },
    },
    { _id: false }
);

const ChecklistInstanceSchema = new mongoose.Schema(
    {
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organisation',
            required: true,
        },
        checklistTemplateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChecklistTemplate',
            required: false,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            trim: true,
            default: 'general',
        },
        appliesTo: {
            type: String,
            enum: ['event', 'vehicle', 'run', 'general'],
            default: 'general',
        },
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: false,
        },
        vehicleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: false,
        },
        runId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Run',
            required: false,
        },
        status: {
            type: String,
            enum: ['open', 'completed', 'archived'],
            default: 'open',
        },
        items: {
            type: [ChecklistInstanceItemSchema],
            default: [],
            validate: {
                validator: function(items) {
                    return items.length > 0;
                },
                message: 'At least one checklist item is required',
            },
        },
        completedAt: {
            type: Date,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ChecklistInstance', ChecklistInstanceSchema);