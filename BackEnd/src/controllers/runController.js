const Run = require('../models/Run');
const EventVehicle = require('../models/EventVehicle');


// POST - create a tyre

exports.createRun = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;

        const {
            eventVehicleId,
            weather,
            trackTemp,
            trackCondition,
            outTime,
            inTime,
            lapsDone,
            fuelStart,
            fuelEnd,
            bestLapS
        } = req.body;

        if (
            !eventVehicleId ||
            lapsDone == null ||
            fuelStart == null
        ) {
            return res.status(400).json({
                message: 'EventVehicleId, lapsDone and fuelStart are required'
            });
        }

        const fuelUsed = fuelStart - fuelEnd;
        const fuelPerLap = lapsDone > 0 ? fuelUsed / lapsDone : 0;


        // This doesn't work...

        let averageLapS = 0;
        if (outTime && inTime && lapsDone > 0) {
            const runSeconds =
                (new Date(inTime).getTime() - new Date(outTime).getTime()) / 1000;
            averageLapS = runSeconds / lapsDone;
        }

        const run = await Run.create({
            organisationId,
            eventVehicleId,
            weather,
            trackTemp,
            trackCondition,
            outTime,
            inTime,
            lapsDone,
            fuelStart,
            fuelEnd: fuelEnd ?? undefined,
            fuelUsed: 0,
            fuelPerLap: 0,
            averageLapS: 0,
            bestLapS
        });

        res.status(201).json({ run });
    } catch (err) {
        console.error('createRun error', err);
        res.status(500).json({ message: 'Server error' });
    }
};


// GET Runs for eventVehicleId

exports.getRuns = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const {eventVehicleId} = req.query;

        const filter = {
            organisationId,
            isActive: true,
        };

        if (eventVehicleId) {
            filter.eventVehicleId = eventVehicleId;
        }

        const runs = await Run.find(filter).sort({ createdAt: -1 });
        res.json({ runs });
    } catch (err) {
        console.error('getRuns error', err);
        res.status(500).json({ message: 'Server error' });
    }
};


// GET run by ID:

exports.getRunById = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const run = await Run.findOne({
            _id: id,
            organisationId
        });

        if (!run) {
            return res.status(404).json({ message: 'Run not found' });
        }

        res.json({ run });
    } catch (err) {
        console.error('get RunById error', err);
        res.status(500).json({ message: 'Server error' })
    }
}

// Update run

exports.updateRun = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const run = await Run.findOneAndUpdate(
            { _id: id, organisationId, isActive: true },
            req.body,
            { new: true }
        );

        if (!run) {
            return res.status(404).json({ message: 'Run Not Found' });
        }
        res.json({ run });
    } catch (err) {
        console.error('Update Run error', err);
        res.status(500).json({ message: 'Server Error' });
    }
};


// Archive / delete run

exports.archiveRun = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const run = await Run.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: false },
            { new: true }
        );
        if (!run) {
            return res.status(404).json({ message: 'Run Not Found' });
        }
        res.json({ message: 'Run Archived', run });
    } catch (err) {
        console.error('Archive run error', err);
        res.status(500).json({ message: 'Server Error' });
    }
};


// Unarchive a run

exports.unarchiveRun = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const run = await Run.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: true },
            { new: true }
        );
        if (!run) {
            return res.status(404).json({ message: 'Run Not Found' });
        }
        res.json({ message: 'Run Unarchived', run });
    } catch (err) {
        console.error('Unarchive run error', err);
        res.status(500).json({ message: 'Server Error' });
    }
};