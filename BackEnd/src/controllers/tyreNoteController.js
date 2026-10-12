const TyreNote = require("../models/TyreNote");
const TyreRun = require("../models/TyreRun");
const Run = require("../models/Run");
const Tyre = require("../models/Tyre")


exports.createTyreNote = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { runId, corner, category, note } = req.body;

        const validCorners = ["LF", "RF", "LR", "RR"];

        if (
            !runId ||
            !validCorners.includes(corner) ||
            !note?.trim()
        ) {
            return res.status(400).json({
                message: "Run, corner and note are required",
            });
        }

        const run = await Run.findOne({
            _id: runId,
            organisationId,
            isActive: true,
        });
        if (!run) {
            return res.status(404).json({
                message: "Run not found",
            });
        }

        const tyreRun = await TyreRun.findOne({
            organisationId,
            runId,
            isActive: true,
        });

        if (!tyreRun) {
            return res.status(404).json({
                message: "Tyre run not found",
            });
        }

        const tyreId = tyreRun.tyres[corner];

        if (!tyreId) {
            return res.status(400).json({
                message: "No tyre assigned to this corner",
            });
        }

        const tyre = await Tyre.findOne({
            _id: tyreId,
            organisationId,
        });

        if (!tyre) {
            return res.status(404).json({
                message: "Tyre not found",
            });
        }

        const tyreNote = await TyreNote.create({
            organisationId,
            tyreId,
            runId,
            corner,
            category: category || "General",
            note: note.trim(),
        })

        res.status(201).json({ tyreNote });
    } catch (err) {
        console.error("Create Tyre Note error", err);

        if (err.name === "ValidationError" ||
            err.name === "CastError") {
            return res.status(400).json({
                message: err.message,
            });
        }
        res.status(500).json({
            message: "Server error",
        });
    }
};

exports.getTyreNotes = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { tyreId, runId } = req.query;

        if (!tyreId && !runId) {
            return res.status(400).json({
                message: "tyreId or runId is required",
            });
        }

        const filter = {
            organisationId,
            isActive: true,
        };

        if (tyreId) filter.tyreId = tyreId;
        if (runId) filter.runId = runId;

        const tyreNotes = await TyreNote.find(filter)
            .sort({ createdAt: -1 })
            .populate("runId", "name outTime inTime");

        res.json({ tyreNotes });
    } catch (err) {
        console.error("Get Tyre Notes error", err);
        res.status(500).json({
            message: "Server error",
        });
    }
};

exports.archiveTyreNote = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const tyreNote = await TyreNote.findOneAndUpdate(
            {
                _id: id,
                organisationId,
                isActive: true,
            },
            { isActive: false },
            { new: true }
        );

        if (!tyreNote) {
            return res.status(404).json({
                message: "Tyre note not found",
            });
        }

        res.json({
            message: "Tyre note archived",
            tyreNote,
        });
    } catch (err) {
        console.error("Archive Tyre Note error", err);
        res.status(500).json({
            message: "Server error",
        });
    }
};