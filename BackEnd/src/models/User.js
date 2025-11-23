// Schema for user data used for authentication and personalisation 

const mongoose = require('mongoose'); // import mongoose into this file 

const UserSchema = new mongoose.Schema( //Create new schema 
    {
        organisationId: { // Use the Oganisation ID as a a foreign key - to link the user to their organisation
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Organisation',
            required: true,
        },
        email: { type: String, required: true, unique: true }, // Do we want this to be lowercase: true too??
        passwordHash: { type: String, required: true },
        name: { type: String },
        role: {
            type: String,
            enum: ['admin', 'engineer', 'mechanic', 'viewer'], // enum for choosing between the roles (make this into a drop down)
            default: 'engineer',
        },
        isActive: { type: Boolean, default: true }, // Not 100% sure if I need this...
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema)