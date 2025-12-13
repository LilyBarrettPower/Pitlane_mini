const EventSchema = new mongoose.Schema(
    {
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organisation',
            required: true,
        },
        trackId: {
            type: mongoose.Schema.types.ObjectId,
            ref: 'Track',
            required: true,
        },
        name: { type: String, required: true },
        type: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        notes: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);
