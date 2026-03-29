const SetUp = require('../models/SetUp');
const Vehicle = require('../models/Vehicle');

// Create a setup 

exports.createSetUp = async(req, res) => {
    try {
        const organisationId = req.user.organisationId;

        const {
            vehicleId,
            version, 
            springNm, 
            arbPos,
            rideHeight,
            camber,
            toe,
            packers,
            diffPreload,
            brakeBias,
            wingHole,
            splitter,
            notes
        } = req.body;

        if (!vehicleId || !version ) {
            return res.status(400).json({ message: 'VehicleId and version are required' });
        }

        const setup = await SetUp.create({
            organisationId,
            vehicleId,
            version, 
            springNm, 
            arbPos,
            rideHeight,
            camber,
            toe,
            packers,
            diffPreload,
            brakeBias,
            wingHole,
            splitter,
            notes: notes || '',
        })

        res.status(201).json({setup});
    } catch (err) {
        console.error('Create Setup Error', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get setups

exports.getSetUps = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { vehicleId, version } = req.query;

        const filter = {
            organisationId,
            isActive: true,
        };

        if (vehicleId) filter.vehicleId = vehicleId;
        if (version) filter.version = version;

        const setups = await SetUp.find(filter).sort({ createdAt: -1 });
        res.json({ setups });
    } catch (err) {
        console.error('getSetUps error', err);
        res.status(500).json({ message: 'Server error' });
    }
};


// Get setup by ID 

exports.getSetUpById = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const setup = await SetUp.findOne({
            _id: id,
            organisationId
        });

        if (!setup) {
            return res.status(404).json({ message: 'SetUp not found' });
        }

        res.json({ setup});
    } catch (err) {
        console.error('get SetUpById error', err);
        res.status(500).json({ message: 'Server error' })
    }
};

// Update Set Up

exports.updateSetUp = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const setup = await SetUp.findOneAndUpdate(
            { _id: id, organisationId, isActive: true },
            req.body,
            { new: true }
        );

        if (!setup) {
            return res.status(404).json({ message: 'SetUp Not Found' });
        }
        res.json({ setup });
    } catch (err) {
        console.error('Update SetUp error', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Archive set up


exports.archiveSetUp = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const setup = await SetUp.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: false },
            { new: true }
        );
        if (!setup) {
            return res.status(404).json({ message: 'SetUp Not Found' });
        }
        res.json({ message: 'SetUp Archived', setup });
    } catch (err) {
        console.error('Archive setup error', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Un archive setup

exports.unarchiveSetUp = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const setup = await SetUp.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: true },
            { new: true }
        );
        if (!setup) {
            return res.status(404).json({ message: 'SetUp Not Found' });
        }
        res.json({ message: 'SetUp Unarchived', setup });
    } catch (err) {
        console.error('Unarchive setup error', err);
        res.status(500).json({ message: 'Server Error' });
    }
};


