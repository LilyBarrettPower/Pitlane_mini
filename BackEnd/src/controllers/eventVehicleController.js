const EventVehicle = require("../models/EventVehicle");
const Vehicle = require("../models/Vehicle");
const Event = require("../models/Event");


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

        console.log("createAssignment body:", {
            organisationId: req.user.organisationId,
            vehicleId,
            eventId,
        });

        const vehicle = await Vehicle.findOne({ _id: vehicleId, organisationId });
        console.log("Found the vehicle", vehicle);

        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        let event = await Event.findOne({ _id: eventId, organisationId });
        console.log("Found the event:", event);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
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
                .json({ message: "This event is already assigned to this vehicle" });
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

        const assignments = await EventVehicle.find({
            organisationId,
            vehicleId,
            isActive: true,
        })
            .populate("eventId")
            .sort({ createdAt: 1 });

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