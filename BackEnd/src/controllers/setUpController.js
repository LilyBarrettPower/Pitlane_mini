const mongoose = require("mongoose");
const SetUp = require("../models/SetUp");
const Vehicle = require("../models/Vehicle");

// The setup fields a create / update is allowed to set
const EDITABLE_FIELDS = [
    "version",
    "springNm",
    "arbPos",
    "rideHeight",
    "camber",
    "toe",
    "packers",
    "diffPreload",
    "brakeBias",
    "wingHole",
    "splitter",
    "notes",
];

const MAX_CUSTOM_VALUE_LENGTH = 60;

// Keeps only well-formed custom values: a valid field id plus text values
function cleanCustomValues(customValues) {
    if (!Array.isArray(customValues)) return [];

    const text = (value) => String(value ?? "").trim().slice(0, MAX_CUSTOM_VALUE_LENGTH);

    return customValues
        .filter((item) => item && mongoose.isValidObjectId(item.fieldId))
        .map((item) => ({
            fieldId: item.fieldId,
            front: text(item.front),
            rear: text(item.rear),
            value: text(item.value),
            lf: text(item.lf),
            rf: text(item.rf),
            lr: text(item.lr),
            rr: text(item.rr),
        }));
}

// Picks the editable fields out of a request body
function setUpDataFromBody(body) {
    const data = {};

    for (const field of EDITABLE_FIELDS) {
        if (body[field] !== undefined) data[field] = body[field];
    }

    if (body.customValues !== undefined) {
        data.customValues = cleanCustomValues(body.customValues);
    }

    return data;
}

// Create a setup

exports.createSetUp = async(req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { vehicleId, version } = req.body;

        if (!vehicleId || !version ) {
            return res.status(400).json({ message: "VehicleId and version are required" });
        }

        // The vehicle must belong to this organisation
        const vehicle = await Vehicle.findOne({ _id: vehicleId, organisationId });
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        const setup = await SetUp.create({
            ...setUpDataFromBody(req.body),
            organisationId,
            vehicleId,
            notes: req.body.notes || "",
        });

        res.status(201).json({setup});
    } catch (err) {
        console.error("Create Setup Error", err);
        res.status(500).json({ message: "Server error" });
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
        console.error("getSetUps error", err);
        res.status(500).json({ message: "Server error" });
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
            return res.status(404).json({ message: "SetUp not found" });
        }

        res.json({ setup});
    } catch (err) {
        console.error("get SetUpById error", err);
        res.status(500).json({ message: "Server error" })
    }
};

// Update Set Up

exports.updateSetUp = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        // Only editable fields - can't move a setup to another vehicle or
        // organisation, or archive it, through a plain update
        const setup = await SetUp.findOneAndUpdate(
            { _id: id, organisationId, isActive: true },
            setUpDataFromBody(req.body),
            { new: true, runValidators: true }
        );

        if (!setup) {
            return res.status(404).json({ message: "SetUp Not Found" });
        }
        res.json({ setup });
    } catch (err) {
        console.error("Update SetUp error", err);
        res.status(500).json({ message: "Server Error" });
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
            return res.status(404).json({ message: "SetUp Not Found" });
        }
        res.json({ message: "SetUp Archived", setup });
    } catch (err) {
        console.error("Archive setup error", err);
        res.status(500).json({ message: "Server Error" });
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
            return res.status(404).json({ message: "SetUp Not Found" });
        }
        res.json({ message: "SetUp Unarchived", setup });
    } catch (err) {
        console.error("Unarchive setup error", err);
        res.status(500).json({ message: "Server Error" });
    }
};


