// Controller for organisation route

const Organisation = require('../models/Organisation');

exports.getMyOrganisation = async (req, res) => {
    try {
        const org = await Organisation.findById(req.user.organisationId);
        if (!org) {
            return res
                .status(404)
                .json({ message: 'Organisation not found' });
        }
        res.json({ organisation: org });
    } catch (err) {
        console.error('getMyOrganisation error', err);
        res.status(500).json({ message: 'Server error' });
    }
};