const VehicleDriver = require('../models/VehicleDriver');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');


// Create a vehicle driver:

exports.createAssignment = async (req, res) => {
    try {
        const { vehicleId, driverId, role } = req.body;

        if (!vehicleId || !driverId) {
            return res
                .status(400)
                .json({ message: 'VehicleId and DriverId are required' });
        }
        const organisationId = req.user.organisationId;

        console.log('createAssignment body:', {
            organisationId: req.user.organisationId,
            vehicleId,
            driverId,
        });

        const vehicle = await Vehicle.findOne({ _id: vehicleId, organisationId });
        console.log('Found the vehicle', vehicle);

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        let driver = await Driver.findOne({ _id: driverId, organisationId });
        console.log('Found the driver:', driver);

        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        const assignment = await VehicleDriver.create({
            organisationId,
            vehicleId,
            driverId,
            role: role || '',
        });

        res.status(201).json({ assignment });
    } catch (err) {
        console.error('Create assignment error', err);
        if (err.code == 11000) {
            return res
                .status(409)
                .json({ message: 'This driver is already assigned to this vehicle' });
        }

        res.status(500).json({ message: 'Server error' });
    }
};

//GET a list of drivers for each vehicle

exports.getDriverForVehicle = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const { organisationId } = req.user.organisationId;
        
        const assignments = await VehicleDriver.find({
            organisationId,
            vehicleId,
            isActive: true,
        })
            .populate('driverId')
            .sort({ createdAt: 1 });
        
        res.json({ assignments });
    } catch (err) {
        console.error('Get Driver For Vehicle error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// GET a list of vehicles for each driver 

exports.getVehicleForDriver = async (req, res) => {
    try {
        const { driverId } = req.params;
        const { organisationId } = req.user.organisationId;

        const assignments = await VehicleDriver.find({
            organisationId,
            driverId,
            isActive: true,
        })
            .populate('vehicleId')
            .sort({ createdAt: 1 });

        res.json({ assignments });
    } catch (err) {
        console.error('Get Vehicle For Driver error', err);
        res.status(500).json({ message: 'Server error' });
    }
};  

exports.archiveAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const assignment = await VehicleDriver.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: true },
            { new: true },
        );
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        res.json({ message: 'Assignment archived', assignment });
    } catch (err) {
        console.error('Archive assignment error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.unArchiveAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const assignment = await VehicleDriver.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: false },
            { new: true },
        );
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        res.json({ message: 'Assignment unarchived', assignment });
    } catch (err) {
        console.error('Unarchive assignment error', err);
        res.status(500).json({ message: 'Server error' });
    }
}
    
    
    
    
    
    


