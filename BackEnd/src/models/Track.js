const mongoose = require("mongoose");

const TrackSchema = new mongoose.Schema(
    {
        organisationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organisation",
            required: true,
        },
        name: { type: String, required: true, trim: true },
        distanceKms: { type: Number, default: null },
        country: { type: String, required: true, trim: true },
        city: {type: String, trim: true},
        notes: { type: String, default: "" },
        // Set when the track was added from the built-in library
        // (data/trackLibrary.js), so it isn't added twice
        libraryKey: { type: String, default: null },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

TrackSchema.index({ organisationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Track", TrackSchema);