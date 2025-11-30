const Vehicle = require('../models/Vehicle');

//POST Vehicle (create a vehicle)

exports.createVehicle = async (req, res) => {
    try {
        const { name, racingNumber, make, model, year, owner, odo } = req.body; // Need to update this when you update model 
        if (!name) {
            return res.Status(400).json({ message: 'Vehicle name is required' });
        }

        const vehicle = await Vehicle.create({
            organisationId: req.user.organisationId,
            name,
            racingNumber,
            make,
            model,
            year,
            owner,
            odo,
        });
        res.status(201).json({ vehicle });
    } catch (err) {
        console.error('createVehicle error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

//GET vehicle (retireve all vehicles ):
exports.getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({
            organisationId: req.user.organisationId,
            isActive: true,
        }).sort({ createdAt: -1 });

        res.json({ vehicles });
    } catch (err) {
        console.error('getVehicle error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET vehicle (retrieve by vehicle ID):

exports.getVehicleById = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await Vehicle.findOne({
            _id: id,
            organisationId: req.user.organisationId,
        });
        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' }) // Add a page display here for this error on the front end 
        }
        res.json({ vehicle });
    } catch (err) {
        console.error('getVehicleById error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// PATCH vehicle (update a vehicle based on their id)

exports.updateVehicle = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await Vehicle.findOneAndUpdate(
            { _id: id, organisationId: req.user.organisationId },
            req.body,
            { new: true } // whats this do?
        );

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.json({ vehicle });
    } catch (err) {
        console.error('UpdateVehicle Error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// DELETE Vehicle 

exports.deleteVehicle = async (req, res) => {
    try {
        const { id } = req.params;

        const vehicle = await Vehicle.findOneAndUpdate(
            { _id: id, organisationId: req.user.organisationId },
            { isActive: false },
            { new: true },
        );

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }
        res.json({ message: 'Vehicle archived', vehicle });
    } catch (err) {
        console.error('Delete Vehicle error'.err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.unarchiveVehicle = async (req, res) => {
    try {
        const { id } = req.params;

        const vehicle = await Vehicle.findOneAndUpdate(
            {
                _id: id,
                organisationId: req.user.organisationId
            },
            { isActive: true },
            { new: true }
        );

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.json({
            message: 'Vehicle Unarchived',
            vehicle,
        });
    } catch (err) {
        console.error('unarchive Vehicle error', err);
        res.status(500).json({ message: 'Server error ' });
    }
};
