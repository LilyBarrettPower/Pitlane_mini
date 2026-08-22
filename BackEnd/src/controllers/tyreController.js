const Tyre = require("../models/Tyre");
const Vehicle = require("../models/Vehicle");

// POST - create a tyre

exports.createTyre = async (req, res) => {
    try {

        const organisationId = req.user.organisationId;

        const { vehicleId, brand, spec, currentSet, size, position, fiaSerial, condition, heatCycles, kmTotal, notes } = req.body;
        if (!vehicleId || !brand || !condition ) {
            return res.status(400).json({ message: "VehicleId, brand and condition are required" });
        }

        // Safety: ensure vehicle belongs to this org
        const vehicle = await Vehicle.findOne({ _id: vehicleId, organisationId, isActive: true });
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        const tyre = await Tyre.create({
            organisationId,
            vehicleId,
            brand,
            spec,
            currentSet, 
            size,
            position,
            fiaSerial: fiaSerial || "",
            condition, 
            heatCycles: heatCycles ?? 0,
            kmTotal: kmTotal ?? 0,
            notes: notes || "",
        });

        res.status(201).json({ tyre});
    } catch (err) {
        console.error("createTyre error", err);

        // Check to make sure there isn"t duplicate fia serial numbers
        if (err.code === 11000) {
            return res.status(409).json({
                message: "A tyre with this FIA serial number already exists",
            });
        }
        res.status(500).json({ message: "Server error" });
    }
};

// GET Tyres:

exports.getTyres = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { vehicleId, condition, spec, brand } = req.query;

        const filter = {
            organisationId,
            isActive: true,
        };

        if (vehicleId) filter.vehicleId = vehicleId;
        if (condition) filter.condition = condition;
        if (spec) filter.spec = spec;
        if (brand) filter.brand = brand;

        const tyres = await Tyre.find(filter).sort({ createdAt: -1 });
        res.json({ tyres });
    } catch (err) {
        console.error("getTyres error", err);
        res.status(500).json({ message: "Server error" });
    }
};


// GET tyre by ID:

exports.getTyreById = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const tyre = await Tyre.findOne({
            _id: id,
            organisationId
        });

        if (!tyre) {
            return res.status(404).json({ message: "Tyre not found" });
        }

        res.json({ tyre});
    } catch (err) {
        console.error("get TyreById error", err);
        res.status(500).json({ message: "Server error" })
    }
}

// Update tyre

exports.updateTyre = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const tyre = await Tyre.findOneAndUpdate(
            { _id: id, organisationId, isActive: true },
            req.body,
            { new: true }
        );

        if (!tyre) {
            return res.status(404).json({ message: "Tyre Not Found" });
        }
        res.json({ tyre });
    } catch (err) {
        console.error("Update Tyre error", err);
        res.status(500).json({ message: "Server Error" });
    }
};


// Archive / delete tyre 

exports.archiveTyre = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const tyre = await Tyre.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: false },
            { new: true }
        );
        if (!tyre) {
            return res.status(404).json({ message: "Tyre Not Found" });
        }
        res.json({ message: "Tyre Archived", tyre });
    } catch (err) {
        console.error("Archive tyre error", err);
        res.status(500).json({ message: "Server Error" });
    }
};


// Unarchive an tyre

exports.unarchiveTyre = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const tyre = await Tyre.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: true },
            { new: true }
        );
        if (!tyre) {
            return res.status(404).json({ message: "Tyre Not Found" });
        }
        res.json({ message: "Tyre Unarchived", tyre });
    } catch (err) {
        console.error("Unarchive tyre error", err);
        res.status(500).json({ message: "Server Error" });
    }
};

exports.archiveTyreSet = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const {vehicleId, currentSet} = req.body;

        if (!vehicleId || !currentSet) {
            return res.status(400).json({
                message: "vehicleId and currentSet are required",
            });
        }

        const tyres = await Tyre.find({
            organisationId,
            vehicleId,
            currentSet: {
                $regex: `^${currentSet}$`,
                $options: "i",
            },
            isActive: true,
        });

        if (tyres.length === 0) {
            return res.status(404).json({
                message: "No active tyres found in this set",
            });
        }

        const result = await Tyre.updateMany(
            {
                organisationId,
                vehicleId,
                currentSet,
                isActive: true,
            },
            {
                $set: {
                    isActive: false,
                },
            }
        );

        res.json({
            message: "Tyre set archived",
            archivedCount: XPathResult.modifiedCount,
        });
    } catch (err) {
        console.error("archiveTyreSet error", err);

        res.status(500).json({
            message: "Server error",
        });
    }
};