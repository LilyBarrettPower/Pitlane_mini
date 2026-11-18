const RunSetUp = require("../models/RunSetUp");
const Run = require("../models/Run");
const SetUp = require("../models/SetUp");
const EventVehicle = require("../models/EventVehicle");
const Event = require("../models/Event");
const Track = require("../models/Track"); // registers the model for populate("trackId")

// Create Run Set Up


exports.createAssignment = async (req, res) => {
    try {
        const { runId, setUpId} = req.body;

        if (!runId || !setUpId) {
            return res
                .status(400)
                .json({ message: "RunId and setUpId are required" });
        }
        const organisationId = req.user.organisationId;


        const run = await Run.findOne({ _id: runId, organisationId });

        if (!run) {
            return res.status(404).json({ message: "Run not found" });
        }

        let setUp = await SetUp.findOne({ _id: setUpId, organisationId });

        if (!setUp) {
            return res.status(404).json({ message: "SetUp not found" });
        }

        const assignment = await RunSetUp.create({
            organisationId,
            runId,
            setUpId,
        });

        res.status(201).json({ assignment });
    } catch (err) {
        console.error("Create assignment error", err);
        if (err.code == 11000) {
            return res
                .status(409)
                .json({ message: "This setup has already been assigned to this run" });
        }

        res.status(500).json({ message: "Server error" });
    }
};

// Get a list of setup for a run

exports.getSetUpForRun = async (req, res) => {
    try {
        const { runId } = req.params;
        const organisationId = req.user.organisationId;

        const assignments = await RunSetUp.find({
            organisationId,
            runId,
            isActive: true,
        })
            .populate("setUpId")
            .sort({ createdAt: 1 });

        res.json({ assignments });
    } catch (err) {
        console.error("Get Setup for run error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// Get a list of runs where a setup was used

exports.getRunsForSetUp = async (req, res) => {
    try {
        const { setUpId } = req.params;
        const organisationId = req.user.organisationId;

        const assignments = await RunSetUp.find({
            organisationId,
            setUpId,
            isActive: true,
        })
            .populate("runId")
            .sort({ createdAt: 1 });

        res.json({ assignments });
    } catch (err) {
        console.error("Get Runs for setUp error", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.archiveAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const assignment = await RunSetUp.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: false },
            { new: true },
        );
        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        res.json({ message: "Assignment archived", assignment });
    } catch (err) {
        console.error("Archive assignment error", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.unArchiveAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const assignment = await RunSetUp.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: true },
            { new: true },
        );
        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }

        res.json({ message: "Assignment unarchived", assignment });
    } catch (err) {
        console.error("Unarchive assignment error", err);
        res.status(500).json({ message: "Server error" });
    }
}


// Batch-loads the event for each run (run -> event vehicle -> event) with
// two queries, rather than one query per run. Returns a lookup function.
// Archived events are left out (the lookup returns null for them).
async function loadEventsForRuns(runs, organisationId) {
    const eventVehicles = await EventVehicle.find({
        _id: { $in: runs.map((run) => run.eventVehicleId) },
        organisationId,
    });
    const eventVehicleById = new Map(
        eventVehicles.map((eventVehicle) => [String(eventVehicle._id), eventVehicle])
    );

    const events = await Event.find({
        _id: { $in: eventVehicles.map((eventVehicle) => eventVehicle.eventId) },
        organisationId,
        isActive: true,
    }).populate("trackId", "name");
    const eventById = new Map(events.map((event) => [String(event._id), event]));

    return (run) => {
        const eventVehicle = eventVehicleById.get(String(run.eventVehicleId));
        if (!eventVehicle) return null;
        return eventById.get(String(eventVehicle.eventId)) || null;
    };
}

// PUT - set the one setup a run used (replaces any previous one).
// Body: { setUpId } - send null/empty to clear the run's setup.
exports.setSetUpForRun = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { runId } = req.params;
        const { setUpId } = req.body;

        const run = await Run.findOne({ _id: runId, organisationId, isActive: true });

        if (!run) {
            return res.status(404).json({ message: "Run not found" });
        }

        if (!setUpId) {
            await RunSetUp.updateMany(
                { organisationId, runId, isActive: true },
                { isActive: false }
            );
            return res.json({ assignment: null });
        }

        const eventVehicle = await EventVehicle.findOne({
            _id: run.eventVehicleId,
            organisationId,
        });

        if (!eventVehicle) {
            return res.status(404).json({ message: "Event vehicle not found" });
        }

        // The setup must belong to the same car the run is for
        const setUp = await SetUp.findOne({
            _id: setUpId,
            organisationId,
            vehicleId: eventVehicle.vehicleId,
            isActive: true,
        });

        if (!setUp) {
            return res.status(404).json({ message: "Setup not found for this vehicle" });
        }

        // One setup per run: archive any other setup linked to this run...
        await RunSetUp.updateMany(
            { organisationId, runId, setUpId: { $ne: setUp._id }, isActive: true },
            { isActive: false }
        );

        // ...then link this one (reusing an archived link if there is one)
        const assignment = await RunSetUp.findOneAndUpdate(
            { organisationId, runId, setUpId: setUp._id },
            { $set: { isActive: true } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        ).populate("setUpId");

        res.json({ assignment });
    } catch (err) {
        console.error("Set setup for run error", err);
        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid id" });
        }
        res.status(500).json({ message: "Server error" });
    }
};

// GET - every event a setup has been used at, one summary row per event:
// { eventId, eventName, startDate, endDate, trackName, runCount, laps, bestLapS }
exports.getSetUpEventHistory = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { setUpId } = req.params;

        const setUp = await SetUp.findOne({ _id: setUpId, organisationId });

        if (!setUp) {
            return res.status(404).json({ message: "Setup not found" });
        }

        const assignments = await RunSetUp.find({
            organisationId,
            setUpId: setUp._id,
            isActive: true,
        });

        const runs = await Run.find({
            _id: { $in: assignments.map((assignment) => assignment.runId) },
            organisationId,
            isActive: true,
        });

        const eventForRun = await loadEventsForRuns(runs, organisationId);
        const summaryByEventId = new Map();

        for (const run of runs) {
            const event = eventForRun(run);
            if (!event) continue;

            const key = String(event._id);
            if (!summaryByEventId.has(key)) {
                summaryByEventId.set(key, {
                    eventId: event._id,
                    eventName: event.name,
                    startDate: event.startDate,
                    endDate: event.endDate,
                    trackName: event.trackId?.name || "",
                    runCount: 0,
                    laps: 0,
                    bestLapS: null,
                });
            }

            const summary = summaryByEventId.get(key);
            summary.runCount += 1;
            summary.laps += run.lapsDone ?? 0;

            if (Number.isFinite(run.bestLapS) && run.bestLapS > 0) {
                summary.bestLapS =
                    summary.bestLapS === null
                        ? run.bestLapS
                        : Math.min(summary.bestLapS, run.bestLapS);
            }
        }

        const events = [...summaryByEventId.values()].sort(
            (a, b) => new Date(b.startDate) - new Date(a.startDate)
        );

        res.json({ events });
    } catch (err) {
        console.error("Get setup event history error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET - for each of a vehicle's setups, the events it was used at, plus the
// setup used on the vehicle's most recent run (to pre-select when creating a run).
// { summary: [{ setUpId, events: [{ eventId, eventName, startDate }] }], lastUsedSetUpId }
exports.getVehicleSetUpSummary = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { vehicleId } = req.params;

        const setUps = await SetUp.find({ organisationId, vehicleId, isActive: true }).select("_id");

        const assignments = await RunSetUp.find({
            organisationId,
            isActive: true,
            setUpId: { $in: setUps.map((setUp) => setUp._id) },
        });

        const runs = await Run.find({
            _id: { $in: assignments.map((assignment) => assignment.runId) },
            organisationId,
            isActive: true,
        });
        const runById = new Map(runs.map((run) => [String(run._id), run]));

        const eventForRun = await loadEventsForRuns(runs, organisationId);

        const eventsBySetUpId = new Map();
        let lastUsedSetUpId = null;
        let lastUsedRunDate = null;

        for (const assignment of assignments) {
            const run = runById.get(String(assignment.runId));
            if (!run) continue;

            const setUpKey = String(assignment.setUpId);

            if (!lastUsedRunDate || run.createdAt > lastUsedRunDate) {
                lastUsedRunDate = run.createdAt;
                lastUsedSetUpId = assignment.setUpId;
            }

            const event = eventForRun(run);
            if (!event) continue;

            if (!eventsBySetUpId.has(setUpKey)) {
                eventsBySetUpId.set(setUpKey, new Map());
            }
            eventsBySetUpId.get(setUpKey).set(String(event._id), {
                eventId: event._id,
                eventName: event.name,
                startDate: event.startDate,
            });
        }

        const summary = [...eventsBySetUpId.entries()].map(([setUpId, events]) => ({
            setUpId,
            events: [...events.values()].sort(
                (a, b) => new Date(b.startDate) - new Date(a.startDate)
            ),
        }));

        res.json({ summary, lastUsedSetUpId });
    } catch (err) {
        console.error("Get vehicle setup summary error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET - the setups used by a car at one event, each with the runs it was used on,
// in the order they were first used: { setUps: [{ setUp: { _id, version }, runs: [{ _id, name }] }] }
exports.getSetUpsForEventVehicle = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { eventVehicleId } = req.params;

        const eventVehicle = await EventVehicle.findOne({ _id: eventVehicleId, organisationId });

        if (!eventVehicle) {
            return res.status(404).json({ message: "Event vehicle not found" });
        }

        const runs = await Run.find({
            organisationId,
            eventVehicleId,
            isActive: true,
        }).sort({ createdAt: 1 });

        const assignments = await RunSetUp.find({
            organisationId,
            isActive: true,
            runId: { $in: runs.map((run) => run._id) },
        }).populate("setUpId", "version");
        const assignmentByRunId = new Map(
            assignments.map((assignment) => [String(assignment.runId), assignment])
        );

        const groups = new Map();

        for (const run of runs) {
            const setUp = assignmentByRunId.get(String(run._id))?.setUpId;
            if (!setUp) continue;

            const key = String(setUp._id);
            if (!groups.has(key)) {
                groups.set(key, {
                    setUp: { _id: setUp._id, version: setUp.version },
                    runs: [],
                });
            }
            groups.get(key).runs.push({ _id: run._id, name: run.name });
        }

        res.json({ setUps: [...groups.values()] });
    } catch (err) {
        console.error("Get setups for event vehicle error", err);
        res.status(500).json({ message: "Server error" });
    }
};
