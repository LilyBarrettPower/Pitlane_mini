const Run = require('../models/Run');
const EventVehicle = require('../models/EventVehicle');
const LapTime = require("../models/LapTimes");

exports.carIn = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const run = await Run.findOne({
            _id: id,
            organisationId,
            isActive: true,
        });

        if (!run) {
            return res.status(404).json({message: "Run not found"});
        }

        const laps = await LapTime.find({
            organisationId,
            runId: id,
            isActive: true,
        }).sort({lapNumber: 1});

        run.inTime = new Date();
        run.lapsDone = laps.length;

        if (laps.length > 0) {
            const validLapTimes = laps
                .map((lap) => lap.lapTimeS)
                .filter((time) => Number.isFinite(time));

            if (validLapTimes.length > 0) {
                const totalLapTime = validLapTimes.reduce(
                    (total, time) => total + time,
                    0
                );

                run.bestLapS = Math.min(...validLapTimes);
                run.averageLapS = totalLapTime / validLapTimes.length;
            }

            const lapsWithFuel = laps.filter(
                (lap) => 
                    lap.fuelRemaining !== undefined &&
                lap.fuelRemaining !== null &&
                Number.isFinite(lap.fuelRemaining)
            );

            if (
                lapsWithFuel.length > 0 &&
                run.fuelStart !== undefined &&
                run.fuelStart !== null
            ) {
                const finalFuelReading = 
                    lapsWithFuel[lapsWithFuel.length - 1].fuelRemaining;

                run.fuelEnd = finalFuelReading;
                run.fuelUsed = run.fuelStart - finalFuelReading;

                run.fuelPerLap = 
                    lapsWithFuel.length > 0
                        ? run.fuelUsed / lapsWithFuel.length
                        : 0;
            }
        }

        await run.save();

        res.json({
            message: "Car marked as in and run calculated",
            run,
        });
    } catch (err) {
        console.error("Car in error", err);
        res.status(500).json({message: "Server error"});
    }
};


// POST - create a run

exports.createRun = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;

        const {
            eventVehicleId,
            name,
            weather,
            trackTemp,
            trackCondition,
            fuelStart,
            notes,
        } = req.body;

        if (
            !eventVehicleId ||
            fuelStart == null
        ) {
            return res.status(400).json({
                message: 'EventVehicleId and fuelStart are required'
            });
        }

        const run = await Run.create({
            organisationId,
            eventVehicleId,
            name: name || "",
            weather: weather || "",
            trackTemp: trackTemp ?? undefined,
            trackCondition: trackCondition || "",
            fuelStart,
            lapsDone: 0,
            fuelUsed: 0,
            fuelPerLap: 0,
            averageLapS: 0,
            notes: notes || "",
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

        const run = await Run.findOne({
            _id: id,
            organisationId,
            isActive: true,
        });

        if (!run) {
            return res.status(404).json({ message: 'Run Not Found' });
        }

        Object.assign(run, req.body);

        if (run.fuelStart != null && run.fuelEnd != null) {
            run.fuelUsed = run.fuelStart - run.fuelEnd;
            run.fuelPerLap = 
                run.lapsDone && run.lapsDone > 0 ? run.fuelUsed / run.lapsDone : 0;
        }
        await run.save();
        
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