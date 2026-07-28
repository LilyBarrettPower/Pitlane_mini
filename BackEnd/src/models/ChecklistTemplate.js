const mongoose = require("mongoose");

const ChecklistTemplateItemSchema = new mongoose.Schema(
    {
        label: {
            type: String,
            required: true,
            trim: true,
        },
        notes: {
            type: String,
            default: "",
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
        isRequired: {
            type: Boolean,
            default: true,
        },
    },
    { _id: false }
);

const ChecklistTemplateSchema = new mongoose.Schema(
    {
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organisation",
            required: true,
        },
        baseTemplateId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ChecklistBaseTemplate",
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
            default: "general",
        },
        appliesTo: {
            type: String,
            enum: ["event", "vehicle", "run", "general"],
            default: "general",
        },
        description: {
            type: String,
            default: "",
        },
        items: {
            type: [ChecklistTemplateItemSchema],
            default: [],
            validate: {
                validator: function(items) {
                    return items.length > 0;
                },
                message: "At least one checklist item is required",
            },
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ChecklistTemplate", ChecklistTemplateSchema);