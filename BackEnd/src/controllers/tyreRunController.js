const Run = require("../models/Run");
const Tyre = require("../models/Tyre");
const TyreRun = require("../models/TyreRun");

// POST - create a tyre run

exports.createTyreRun = async (req, res) => {
    try {

        const organisationId = req.user.organisationId;

        const {
            runId,
            tyres,
            coldPsi = {},
            hotPsi = {},
            coldTempC = {},
            hotTempC = {},
            distanceKm = {},
            heatCycleIncrement = {},
            notes = "",
        } = req.body;

        if (
            !runId ||
            !tyres ||
            !tyres.LF ||
            !tyres.RF ||
            !tyres.LR ||
            !tyres.RR
        ) {
            return res.status(400).json({
                message: "runId and tyres LF, RF, LR, RR are required",
            });
        }

        // Safety: ensure run belongs to this org
        const run = await Run.findOne({ _id: runId, organisationId, isActive: true });
        if (!run) {
            return res.status(404).json({ message: "Run not found" });
        }

        // Safety: ensure all tyres belong to this org
        const tyreIds = [tyres.LF, tyres.RF, tyres.LR, tyres.RR];
        const foundTyres = await Tyre.find({
            _id: { $in: tyreIds },
            organisationId,
            isActive: true,
        });

        if (foundTyres.length !== 4) {
            return res.status(404).json({ message: "One or more tyres not found" });
        }

        const tyreRun = await TyreRun.create({
            organisationId,
            runId,
            tyres,
            coldPsi: coldPsi || {},
            hotPsi: hotPsi || {},
            coldTempC: coldTempC || {},
            hotTempC: hotTempC || {},
            distanceKm: {
                LF: distanceKm?.LF ?? 0,
                RF: distanceKm?.RF ?? 0,
                LR: distanceKm?.LR ?? 0,
                RR: distanceKm?.RR ?? 0,
            },
            heatCycleIncrement: {
                LF: heatCycleIncrement?.LF ?? 1,
                RF: heatCycleIncrement?.RF ?? 1,
                LR: heatCycleIncrement?.LR ?? 1,
                RR: heatCycleIncrement?.RR ?? 1,
            },
            notes: notes || "",
        });

        // Update tyre totals
        await Tyre.findOneAndUpdate(
            { _id: tyres.LF, organisationId },
            {
                $inc: {
                    kmTotal: distanceKm?.LF ?? 0,
                    heatCycles: heatCycleIncrement?.LF ?? 1,
                },
            }
        );

        await Tyre.findOneAndUpdate(
            { _id: tyres.RF, organisationId },
            {
                $inc: {
                    kmTotal: distanceKm?.RF ?? 0,
                    heatCycles: heatCycleIncrement?.RF ?? 1,
                },
            }
        );

        await Tyre.findOneAndUpdate(
            { _id: tyres.LR, organisationId },
            {
                $inc: {
                    kmTotal: distanceKm?.LR ?? 0,
                    heatCycles: heatCycleIncrement?.LR ?? 1,
                },
            }
        );

        await Tyre.findOneAndUpdate(
            { _id: tyres.RR, organisationId },
            {
                $inc: {
                    kmTotal: distanceKm?.RR ?? 0,
                    heatCycles: heatCycleIncrement?.RR ?? 1,
                },
            }
        );

        res.status(201).json({ tyreRun });
    } catch (err) {
        console.error("createTyreRun error", err);

        if (err.code === 11000) {
            return res.status(409).json({
                message: "A tyre run already exists for this run",
            });
        }

        res.status(500).json({ message: "Server error" });
    }
};



// GET Tyre Runs

exports.getTyreRuns = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { runId } = req.query;

        const filter = {
            organisationId,
            isActive: true,
        };

        if (runId) filter.runId = runId;

        const tyreRuns = await TyreRun.find(filter).sort({ createdAt: -1 });
        res.json({ tyreRuns });
    } catch (err) {
        console.error("getTyreRuns error", err);
        res.status(500).json({ message: "Server error" });
    }
};


// GET tyre run by ID:

exports.getTyreRunById = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const tyreRun = await TyreRun.findOne({
            _id: id,
            organisationId
        });

        if (!tyreRun) {
            return res.status(404).json({ message: "Tyre Run not found" });
        }

        res.json({ tyreRun});
    } catch (err) {
        console.error("get TyreRunById error", err);
        res.status(500).json({ message: "Server error" })
    }
}

// Update tyre Run

exports.updateTyreRun = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const tyreRun = await TyreRun.findOneAndUpdate(
            { _id: id, organisationId, isActive: true },
            req.body,
            { new: true }
        );

        if (!tyreRun) {
            return res.status(404).json({ message: "Tyre Run Not Found" });
        }
        res.json({ tyreRun });
    } catch (err) {
        console.error("Update Tyre Run error", err);
        res.status(500).json({ message: "Server Error" });
    }
};


// Archive / delete tyre run 

exports.archiveTyreRun = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const tyreRun = await TyreRun.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: false },
            { new: true }
        );
        if (!tyreRun) {
            return res.status(404).json({ message: "Tyre Run Not Found" });
        }
        res.json({ message: "Tyre Run Archived", tyreRun });
    } catch (err) {
        console.error("Archive tyre run error", err);
        res.status(500).json({ message: "Server Error" });
    }
};


// Unarchive a tyre run

exports.unarchiveTyreRun = async (req, res) => {
    try {
        const { id } = req.params;
        const organisationId = req.user.organisationId;

        const tyreRun = await TyreRun.findOneAndUpdate(
            { _id: id, organisationId },
            { isActive: true },
            { new: true }
        );
        if (!tyreRun) {
            return res.status(404).json({ message: "Tyre  Run Not Found" });
        }
        res.json({ message: "Tyre Run Unarchived", tyreRun });
    } catch (err) {
        console.error("Unarchive tyre run error", err);
        res.status(500).json({ message: "Server Error" });
    }
};