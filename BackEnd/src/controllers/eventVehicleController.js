const EventVehicle = require("../models/EventVehicle");
const Vehicle = require("../models/Vehicle");
const Event = require("../models/Event");
require("../models/Track"); // registers the model for populate("trackId")


// Create an event vehicle:

exports.createAssignment = async (req, res) => {
    try {
        const { vehicleId, eventId, type} = req.body;

        if (!vehicleId || !eventId) {
            return res
                .status(400)
                .json({ message: "VehicleId and EventId are required" });
        }
        const organisationId = req.user.organisationId;

        const vehicle = await Vehicle.findOne({ _id: vehicleId, organisationId });

        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        const event = await Event.findOne({ _id: eventId, organisationId });

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // A car can only have one entry per event (enforced by a unique
        // index). Removing a car archives its entry rather than deleting it,
        // so if it's added back we reactivate that entry - which also brings
        // back its runs, tyres and setups for the event.
        const existing = await EventVehicle.findOne({ organisationId, vehicleId, eventId });

        if (existing) {
            if (existing.isActive) {
                return res
                    .status(409)
                    .json({ message: "This vehicle is already assigned to this event" });
            }

            existing.isActive = true;
            if (type !== undefined) existing.type = type || "";
            await existing.save();

            return res.json({ assignment: existing, reactivated: true });
        }

        const assignment = await EventVehicle.create({
            organisationId,
            vehicleId,
            eventId,
            type: type || "", 
        });

        res.status(201).json({ assignment });
    } catch (err) {
        console.error("Create assignment error", err);
        if (err.code == 11000) {
            return res
                .status(409)
                .json({ message: "This vehicle is already assigned to this event" });
        }

        res.status(500).json({ message: "Server error" });
    }
};

// Get a list of vehicles for events

exports.getVehicleForEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const organisationId = req.user.organisationId;

        const assignments = await EventVehicle.find({
            organisationId,
            eventId,
            isActive: true,
        })
            .populate("vehicleId")
            .sort({ createdAt: 1 });

        res.json({ assignments });
    } catch (err) {
        console.error("Get vehicle for event error", err);
        res.status(500).json({ message: "Server error" });
    }
};


// GET a list of events for each vehicle

exports.getEventForVehicle = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const organisationId = req.user.organisationId;

        const found = await EventVehicle.find({
            organisationId,
            vehicleId,
            isActive: true,
        }).populate({
            path: "eventId",
            match: { isActive: true }, // archived events come back as null
            populate: { path: "trackId", select: "name" },
        });

        // Drop archived events and sort by event date (earliest first)
        const assignments = found
            .filter((assignment) => assignment.eventId)
            .sort(
                (a, b) => new Date(a.eventId.startDate) - new Date(b.eventId.startDate)
            );

        res.json({ assignments });
    } catch (err) {
        console.error("Get Events for vehicle error", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.getEventVehicleById = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const eventVehicle = await EventVehicle.findOne({
            _id: id,
            organisationId,
            isActive: true,
        })
            .populate("vehicleId")
            .populate("eventId");

        if (!eventVehicle) {
            return res.status(404).json({
                message: "Event vehicle assignment not found",
            });
        }

        res.json({ eventVehicle });
    } catch (err) {
        console.error("Get event vehicle by ID error", err);

        res.status(500).json({
            message: "Server error",
        });
    }
};

exports.archiveAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const assignment = await EventVehicle.findOneAndUpdate(
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

        const assignment = await EventVehicle.findOneAndUpdate(
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