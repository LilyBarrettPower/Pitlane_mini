const LapTime = require("../models/LapTime");
const Run = require("../models/Run");

async function recalculateRun(runId, organisationId) {
    const laps = await LapTime.find({
        runId,
        organisationId,
        isActive: true,
    }).sort({ lapNumber: 1 });

    const run = await Run.findOne({
        _id: runId,
        organisationId,
        isActive: true,
    });

    if (!run) return;

    run.lapsDone = laps.length;

    if (laps.length > 0) {
        const lapTimes = laps.map((lap) => lap.lapTimeS);
        const totalLapTime = lapTimes.reduce((sum, time) => sum + time, 0);

        run.bestLapS = Math.min(...lapTimes);
        run.averageLapS = totalLapTime / laps.length;
    } else {
        run.bestLapS = undefined;
        run.averageLapS = 0;
    }

    const fuelLaps = laps.filter(
        (lap) => lap.fuelPerLap !== undefined && lap.fuelPerLap !== null
    );

    if (fuelLaps.length > 0) {
        const totalFuelPerLap = fuelLaps.reduce(
            (sum, laps) => sum + lap.fuelPerLap,
            0
        );

        run.fuelPerLap = totalFuelPerLap / fuelLaps.length;
        run.fuelUsed = totalFuelPerLap;
    }

    await run.save();
}

// Create lap time

exports.createLapTime = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;

        const {
            runId,
            lapNumber,
            lapTimeS,
            fuelPerLap,
            trackStatus,
            isInLap,
            isOutLap,
            notes,
        } = req.body;

        if (!runId || lapNumber == null || lapTimeS == null) {
            return res.status(400).json({
                message: "runId, lapNumber and lapTimeS are required",
            });
        }

        const run = await Run.findOne({
            _id: runId,
            organisationId,
            isActive: true,
        });

        if (!run) {
            return res.status(404).json({message: "Run not found"});
        }

        const lapTime = await LapTime.create({
            organisationId,
            runId,
            lapNumber,
            lapTimeS,
            fuelPerLap: fuelPerLap ?? undefined,
            trackStatus: trackStatus || "Green",
            isInLap: isInLap || false,
            isOutLap: isOutLap || false,
            notes: notes || "",
        });

        await recalculateRun(runId, organisationId);
        res.status(201).json({ lapTime });
    } catch (err) {
        console.error("create lap time error", err);

        if (err.code === 11000) {
            return res.status(409).json({
                message: "Lap number already exists for this run",
            });
        }

        res.staus(500).json({message: "Server error"});
    }
};

// Get lap times for a run

exports.getLapTimes = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const {runId} = req.query;

        const filter = {
            organisationId,
            isActive: true,
        };

        if (runId) {
            filter.runId = runId;
        }

        const lapTimes = await LapTime.find(filter).sort({ lapNumber: 1 });

        res.json({ lapTimes });
    } catch (err) {
        console.error("getLapTimes Error", err);
        res.status(500).json({message: "Server error"});
    }
};

// Get lap time by ID
exports.getLapTimeById = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const {id} = req.params;

        const lapTime = await LapTime.findOne({
            _id: id,
            organisationId,
        });

        if (!lapTime) {
            return res.status(404).json({message: "Lap time not found"});
        }

        res.json({ lapTime });
    } catch (err) {
        console.error("Get lap time by Id error", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// Update lap times
exports.updateLapTime = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const lapTime = await LapTime.findOneAndUpdate(
            {_id: id, organisationId, isActive: true},
            req.body,
            {new: true}
        );

        if (!lapTime) {
            return res.status(404).json({message: "Lap time not found"});
        }

        await recalculateRun(lapTime.runId, organisationId);
        res.json({ lapTime });
    } catch (err) {
        console.error("Update lap time error", err);
        res.status(500).json({message: "Server error"});
    }
};

// Archive lap time

exports.archiveLapTime = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const lapTime = await LapTime.findOneAndUpdate(
            {_id: id, organisationId},
            {isActive: false},
            {new: true}
        );

        if (!lapTime) {
            return res.status(404).json({ message: "Lap time not found"});
        }

        await recalculateRun(lapTime.runId, organisationId);

        res.json({ message: "Lap time archived", lapTime});
    } catch (err) {
        console.error("Archive lap time error", err);
        res.status(500).json({ message: "Server Error" });
    }
};

//  Unarchive lap time 

exports.unarchiveLapTime = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const lapTime = await LapTime.findOneAndUpdate(
            {_id: id, organisationId},
            {isActive: true},
            {new: true}
        );

        if (!lapTime) {
            return res.status(404).json({ message: "Lap time not found" });
        }

        await recalculateRun(lapTime.runId, organisationId);

        res.json({ message: "Lap time unarchived", lapTime});
    } catch (err) {
        console.error("UnarchiveLapTime Error", err);
        res.status(500).json({ message: "Server Error"});
    }
};
