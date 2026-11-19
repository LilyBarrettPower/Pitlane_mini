const Vehicle = require("../models/Vehicle");

//POST Vehicle (create a vehicle)

exports.createVehicle = async (req, res) => {
    try {
        const { name, racingNumber, make, model, year, owner, odo, chassisNumber, notes } = req.body; // Need to update this when you update model 
        if (!name) {
            return res.Status(400).json({ message: "Vehicle name is required" });
        }

        const vehicle = await Vehicle.create({
            organisationId: req.user.organisationId,
            name,
            racingNumber,
            make,
            model,
            year,
            owner,
            odo,
            chassisNumber,
            notes,
        });
        res.status(201).json({ vehicle });
    } catch (err) {
        console.error("createVehicle error", err);
        res.status(500).json({ message: "Server error" });
    }
};

//GET vehicle (retireve all vehicles ):
exports.getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find({
            organisationId: req.user.organisationId,
            isActive: true,
        }).sort({ createdAt: -1 });

        res.json({ vehicles });
    } catch (err) {
        console.error("getVehicle error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// GET vehicle (retrieve by vehicle ID):

exports.getVehicleById = async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await Vehicle.findOne({
            _id: id,
            organisationId: req.user.organisationId,
        });
        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" }) // Add a page display here for this error on the front end 
        }
        res.json({ vehicle });
    } catch (err) {
        console.error("getVehicleById error", err);
        res.status(500).json({ message: "Server error" });
    }
};

exports.updateVehicle = async (req, res) => {
    try {
        const {id} = req.params;
        const organisationId = req.user.organisationId;

        const existingVehicle = await Vehicle.findOne({
            _id: id,
            organisationId,
            isActive: true, // Maybe get rid of this?
        });

        if (!existingVehicle) {
            return res.status(404).json({message: "Vehicle not found"});
        }

        // Custom setup fields are managed through their own endpoints below,
        // and these shouldn't be changed through a vehicle edit
        const {
            setupFields,
            organisationId: _organisationId,
            isActive: _isActive,
            ownerHistory: _ownerHistory,
            ...updateData
        } = req.body;

        if (
            req.body.owner &&
            existingVehicle.owner &&
            req.body.owner !== existingVehicle.owner
        ) {
            updateData.$push = {
                ownerHistory: {
                    owner: existingVehicle.owner,
                    changedAt: new Date(),
                },
            };
        }

        const vehicle = await Vehicle.findOneAndUpdate(
            {_id: id, organisationId, isActive: true},
            updateData,
            {new: true, runValidators: true}
        );

        res.json({vehicle});
    } catch (err) {
        console.error("Update Vehicle Error", err);
        res.status(500).json({message: "Server error"});
    }
};


exports.deleteVehicle = async(req,res) => {
    try {
        if (req.user.role !== "admin") {
            return res.status(403).json({
                message: "Only admins can delete vehicles",
            });
        }

        const {id} = req.params;
        const organisationId = req.user.organisationId;

        const vehicle = await Vehicle.findOneAndUpdate(
            {_id: id, organisationId},
            {isActive: false},
            {new: true}
        );

        if(!vehicle) {
            return res.status(404).json({message: "Vehicle not found"});
        }

        res.json({message: "Vehicle deleted", vehicle});
    } catch (err) {
        console.error("archiveVehicle error", err);
        res.status(500).json({message: "Server error"});
    }
};

exports.unarchiveVehicle = async (req, res) => {
    try {
        const { id } = req.params;

        const vehicle = await Vehicle.findOneAndUpdate(
            {
                _id: id,
                organisationId: req.user.organisationId
            },
            { isActive: true },
            { new: true }
        );

        if (!vehicle) {
            return res.status(404).json({ message: "Vehicle not found" });
        }

        res.json({
            message: "Vehicle Unarchived",
            vehicle,
        });
    } catch (err) {
        console.error("unarchive Vehicle error", err);
        res.status(500).json({ message: "Server error " });
    }
};


// ----- Custom setup fields -----
// Extra fields that every setup for this vehicle records.

const SETUP_FIELD_KINDS = ["frontRear", "single", "corners"];

function activeSetupFields(vehicle) {
    return (vehicle.setupFields || []).filter((field) => field.isActive !== false);
}

async function findVehicleForSetupFields(req, res) {
    const vehicle = await Vehicle.findOne({
        _id: req.params.id,
        organisationId: req.user.organisationId,
        isActive: true,
    });

    if (!vehicle) {
        res.status(404).json({ message: "Vehicle not found" });
        return null;
    }

    return vehicle;
}

// Checks a field name: required, not too long, not already used on this vehicle
function setupFieldLabelProblem(vehicle, label, ignoreFieldId) {
    const trimmed = String(label || "").trim();

    if (!trimmed) return "Field name is required";
    if (trimmed.length > 60) return "Field name must be 60 characters or fewer";

    const duplicate = activeSetupFields(vehicle).some(
        (field) =>
            String(field._id) !== String(ignoreFieldId) &&
            field.label.toLowerCase() === trimmed.toLowerCase()
    );

    return duplicate ? "This vehicle already has a field with that name" : null;
}

// POST - add a custom setup field to a vehicle
exports.addSetupField = async (req, res) => {
    try {
        const vehicle = await findVehicleForSetupFields(req, res);
        if (!vehicle) return;

        const { label, unit, kind } = req.body;

        const problem = setupFieldLabelProblem(vehicle, label);
        if (problem) return res.status(400).json({ message: problem });

        if (kind && !SETUP_FIELD_KINDS.includes(kind)) {
            return res.status(400).json({ message: "Field type must be front/rear, single or corners" });
        }

        vehicle.setupFields.push({
            label: String(label).trim(),
            unit: String(unit || "").trim().slice(0, 15),
            kind: kind || "frontRear",
        });
        await vehicle.save();

        const field = vehicle.setupFields[vehicle.setupFields.length - 1];
        res.status(201).json({ field, setupFields: activeSetupFields(vehicle) });
    } catch (err) {
        console.error("addSetupField error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH - rename a custom setup field or change its unit
exports.updateSetupField = async (req, res) => {
    try {
        const vehicle = await findVehicleForSetupFields(req, res);
        if (!vehicle) return;

        const field = vehicle.setupFields.id(req.params.fieldId);
        if (!field || field.isActive === false) {
            return res.status(404).json({ message: "Field not found" });
        }

        if (req.body.label !== undefined) {
            const problem = setupFieldLabelProblem(vehicle, req.body.label, field._id);
            if (problem) return res.status(400).json({ message: problem });
            field.label = String(req.body.label).trim();
        }

        if (req.body.unit !== undefined) {
            field.unit = String(req.body.unit || "").trim().slice(0, 15);
        }

        await vehicle.save();
        res.json({ field, setupFields: activeSetupFields(vehicle) });
    } catch (err) {
        console.error("updateSetupField error", err);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE - remove a custom setup field. It's hidden from every setup, but
// values already entered are kept.
exports.removeSetupField = async (req, res) => {
    try {
        const vehicle = await findVehicleForSetupFields(req, res);
        if (!vehicle) return;

        const field = vehicle.setupFields.id(req.params.fieldId);
        if (!field || field.isActive === false) {
            return res.status(404).json({ message: "Field not found" });
        }

        field.isActive = false;
        await vehicle.save();

        res.json({ message: "Field removed", setupFields: activeSetupFields(vehicle) });
    } catch (err) {
        console.error("removeSetupField error", err);
        res.status(500).json({ message: "Server error" });
    }
};
