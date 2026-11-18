const mongoose = require("mongoose");
const Event = require("../models/Event");
const EventVehicle = require("../models/EventVehicle");
const Run = require("../models/Run");
const LapTime = require("../models/LapTimes");
const Tyre = require("../models/Tyre");
const TyreNote = require("../models/TyreNote");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
require("../models/Track"); // registers the model for populate("trackId")

const DAY_MS = 24 * 60 * 60 * 1000;

// A run that went out more than this long ago and was never marked in is
// treated as forgotten, not "on track now".
const ON_TRACK_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

// Note categories that flag a tyre on the dashboard, most serious first
const SEVERE_NOTE_CATEGORIES = ["Puncture", "Damage", "Flat Spot"];

function vehicleLabel(vehicle) {
    if (!vehicle) return "Unknown vehicle";
    const number = vehicle.racingNumber ? `#${vehicle.racingNumber} ` : "";
    const name =
        vehicle.name || `${vehicle.make || ""} ${vehicle.model || ""}`.trim();
    return `${number}${name || "Unnamed vehicle"}`;
}

// Adds car/event details to a list of runs using two batched queries:
// { runId, runName, eventId, eventName, eventVehicleId, vehicleName, ... }
async function describeRuns(runs, organisationId) {
    const eventVehicles = await EventVehicle.find({
        _id: { $in: runs.map((run) => run.eventVehicleId) },
        organisationId,
    })
        .populate("vehicleId", "name racingNumber make model")
        .populate("eventId", "name");

    const eventVehicleById = new Map(
        eventVehicles.map((eventVehicle) => [String(eventVehicle._id), eventVehicle])
    );

    return runs.map((run) => {
        const eventVehicle = eventVehicleById.get(String(run.eventVehicleId));

        return {
            runId: run._id,
            runName: run.name || "Unnamed Run",
            eventVehicleId: run.eventVehicleId,
            eventId: eventVehicle?.eventId?._id || null,
            eventName: eventVehicle?.eventId?.name || "Unknown event",
            vehicleName: vehicleLabel(eventVehicle?.vehicleId),
        };
    });
}

// The event on today (if any), otherwise the next upcoming one.
// Event dates are stored as the start of each day, so an event counts as
// live until the end of its end date.
async function getCurrentOrNextEvent(organisationId, now) {
    const liveEvent = await Event.findOne({
        organisationId,
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gt: new Date(now.getTime() - DAY_MS) },
    })
        .sort({ startDate: 1 })
        .populate("trackId", "name");

    const event =
        liveEvent ||
        (await Event.findOne({
            organisationId,
            isActive: true,
            startDate: { $gt: now },
        })
            .sort({ startDate: 1 })
            .populate("trackId", "name"));

    if (!event) return null;

    const eventVehicles = await EventVehicle.find({
        organisationId,
        eventId: event._id,
        isActive: true,
    }).populate("vehicleId", "name racingNumber make model");

    const runCount = await Run.countDocuments({
        organisationId,
        isActive: true,
        eventVehicleId: { $in: eventVehicles.map((eventVehicle) => eventVehicle._id) },
    });

    return {
        eventId: event._id,
        name: event.name,
        trackName: event.trackId?.name || "",
        startDate: event.startDate,
        endDate: event.endDate,
        isLive: Boolean(liveEvent),
        vehicles: eventVehicles.map((eventVehicle) => vehicleLabel(eventVehicle.vehicleId)),
        runCount,
    };
}

async function getRunsOnTrack(organisationId, now) {
    const runs = await Run.find({
        organisationId,
        isActive: true,
        outTime: { $gte: new Date(now.getTime() - ON_TRACK_MAX_AGE_MS) },
        inTime: null, // matches runs with no inTime set
    })
        .sort({ outTime: -1 })
        .limit(10);

    if (runs.length === 0) return [];

    const laps = await LapTime.find({
        organisationId,
        isActive: true,
        runId: { $in: runs.map((run) => run._id) },
    }).select("runId");

    const lapCountByRunId = new Map();
    for (const lap of laps) {
        const key = String(lap.runId);
        lapCountByRunId.set(key, (lapCountByRunId.get(key) || 0) + 1);
    }

    const described = await describeRuns(runs, organisationId);

    return described.map((item, index) => ({
        ...item,
        outTime: runs[index].outTime,
        lapCount: lapCountByRunId.get(String(runs[index]._id)) || 0,
    }));
}

async function getFlaggedTyres(organisationId) {
    const groups = await TyreNote.aggregate([
        {
            $match: {
                organisationId: new mongoose.Types.ObjectId(organisationId),
                isActive: true,
                category: { $in: SEVERE_NOTE_CATEGORIES },
            },
        },
        {
            $group: {
                _id: "$tyreId",
                count: { $sum: 1 },
                categories: { $addToSet: "$category" },
                latestAt: { $max: "$createdAt" },
            },
        },
        { $sort: { latestAt: -1 } },
        { $limit: 10 },
    ]);

    if (groups.length === 0) return [];

    const tyres = await Tyre.find({
        _id: { $in: groups.map((group) => group._id) },
        organisationId,
        isActive: true,
    }).populate("vehicleId", "name racingNumber make model");

    const tyreById = new Map(tyres.map((tyre) => [String(tyre._id), tyre]));

    return groups
        .map((group) => {
            const tyre = tyreById.get(String(group._id));
            if (!tyre) return null; // archived tyre

            return {
                tyreId: tyre._id,
                position: tyre.position || "",
                currentSet: tyre.currentSet || "",
                vehicleName: vehicleLabel(tyre.vehicleId),
                noteCount: group.count,
                topCategory: SEVERE_NOTE_CATEGORIES.find((category) =>
                    group.categories.includes(category)
                ),
            };
        })
        .filter(Boolean);
}

async function getHighestMileageTyres(organisationId) {
    const tyres = await Tyre.find({
        organisationId,
        isActive: true,
        kmTotal: { $gt: 0 },
    })
        .sort({ kmTotal: -1, heatCycles: -1 })
        .limit(5)
        .populate("vehicleId", "name racingNumber make model");

    return tyres.map((tyre) => ({
        tyreId: tyre._id,
        position: tyre.position || "",
        currentSet: tyre.currentSet || "",
        vehicleName: vehicleLabel(tyre.vehicleId),
        kmTotal: Math.round((tyre.kmTotal || 0) * 10) / 10,
        heatCycles: tyre.heatCycles || 0,
    }));
}

async function getRecentRuns(organisationId) {
    const runs = await Run.find({ organisationId, isActive: true })
        .sort({ createdAt: -1 })
        .limit(5);

    const described = await describeRuns(runs, organisationId);

    return described.map((item, index) => ({
        ...item,
        lapsDone: runs[index].lapsDone ?? 0,
        bestLapS:
            Number.isFinite(runs[index].bestLapS) && runs[index].bestLapS > 0
                ? runs[index].bestLapS
                : null,
        createdAt: runs[index].createdAt,
    }));
}

async function getStats(organisationId, now) {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfNextYear = new Date(now.getFullYear() + 1, 0, 1);

    const [vehicles, drivers, tyres, eventsThisSeason] = await Promise.all([
        Vehicle.countDocuments({ organisationId, isActive: true }),
        Driver.countDocuments({ organisationId, isActive: true }),
        Tyre.countDocuments({ organisationId, isActive: true }),
        Event.countDocuments({
            organisationId,
            isActive: true,
            startDate: { $gte: startOfYear, $lt: startOfNextYear },
        }),
    ]);

    return { vehicles, drivers, tyres, eventsThisSeason };
}

// GET - everything the dashboard shows, in one request
exports.getDashboard = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const now = new Date();

        const [
            currentEvent,
            onTrack,
            flaggedTyres,
            highestMileageTyres,
            recentRuns,
            stats,
        ] = await Promise.all([
            getCurrentOrNextEvent(organisationId, now),
            getRunsOnTrack(organisationId, now),
            getFlaggedTyres(organisationId),
            getHighestMileageTyres(organisationId),
            getRecentRuns(organisationId),
            getStats(organisationId, now),
        ]);

        res.json({
            currentEvent,
            onTrack,
            flaggedTyres,
            highestMileageTyres,
            recentRuns,
            stats,
        });
    } catch (err) {
        console.error("getDashboard error", err);
        res.status(500).json({ message: "Server error" });
    }
};
