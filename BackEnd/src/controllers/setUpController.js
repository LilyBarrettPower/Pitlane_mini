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
}