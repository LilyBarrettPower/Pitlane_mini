// Authentication model for organisations used for logging in to correct business 

const mongoose = require('mongoose'); // import mongoose into this file 

const OrganisationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, unique: true, sparse: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Organisation', OrganisationSchema);