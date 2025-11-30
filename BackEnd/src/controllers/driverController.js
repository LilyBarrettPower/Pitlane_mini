const Driver = require('../models/Driver');

//POST to create a driver 

exports.createDriver = async (req, res) => {
    try {
        const { name, experience, notes } = req.body;
        
        if (!name) {
            return res.status(400).json({ message: 'Driver name is required' });
        }

        const driver = await Driver.create({
            organisationId: req.user.organisationId,
            name,
            experience: experience || '',
            notes: notes || '',
        });

        res.status(201).json({ driver });
    } catch (err) {
        console.error('Create Driver error', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// GET - retrieve all drivers for an organisation 

exports.getDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find({
            organisationId: req.user.organisationId,
            isActive: true,
        }).sort({ name: 1 });

        res.json({ drivers });
    } catch (err) {
        console.error('Get Drivers error', err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET - one driver based on their ID 
exports.getDriver = async (req, res) => {
    try {
        const { id } = req.params;

        const driver = await Driver.findById({
            _id: id,
            organisationId: req.user.organisationId,
        });

        if (!driver) {
            return res.status(400).json({ message: 'Driver not found' });
        }

        res.json({ driver });
    } catch (err) {
        console.error('Get Driver By ID error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PATCH - Update a drivers information based on their ID 
exports.updateDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const driver = await Driver.findByIdAndUpdate({
            _id: id,
            organisationId: req.user.organisationId,
        },
            req.body,
            { new: true },
        );
        if (!driver) {
            return res.status(400).json({ message: 'Driver not found' });
        }
        res.json({ driver });
    } catch (err) {
        console.error('Update Driver error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE - Archive a driver 
exports.deleteDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const driver = await Driver.findByIdAndUpdate({
            _id: id,
            organisationId: req.user.organisationId,
        },
            { isActive: false },
            { new: true }
        );

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        res.json({
            message: 'Driver archived',
            driver,
        });
    } catch (err) {
        console.error('Delete driver error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PATCH - Unarchive driver 

exports.unarchiveDriver = async (req, res) => {
    try {
        const { id } = req.params;
        const driver = await Driver.findByIdAndUpdate({
            _id: id,
            organisationId: req.user.organisationId,
        },
            { isActive: true },
            { new: true }
        );

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        res.json({
            message: 'Driver unarchived',
            driver,
        });
    } catch (err) {
        console.error('Unarchive driver error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

