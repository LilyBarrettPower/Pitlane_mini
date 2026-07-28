const TyrePressureCheck = require("../models/TyrePressureCheck");
const TyreRun = require("../models/TyreRun");
const LapTime = require("../models/LapTimes");

async function resolveLatestLapNumber({
    organisationId,
    tyreRunId,
    suppliedLapNumber,
}) {
    if (suppliedLapNumber != null) {
        return suppliedLapNumber;
    }

    const tyreRun = await TyreRun.findOne({
        _id: tyreRunId,
        organisationId,
        isActive: true,
    });

    if (!tyreRun) {
        return null;
    }

    const latestLap = await LapTime.findOne({
        organisationId,
        runId: tyreRun.runId,
        isActive: true,
    }).sort({lapNumber: -1});

    return latestLap?.lapNumber ?? undefined;
}

// Create pressure check
exports.createPressureCheck = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;

        const {
            tyreRunId,
            stage,
            pressurePsi,
            tyreTempC,
            rimTempC,
            lapNumber,
            recordedAt,
            notes,
        } = req.body;

        if (!tyreRunId || !stage || !pressurePsi) {
            return res.status(400).json({
                message: "TyreRunId, stage and pressurePsi are required",
            });
        }

        const validStages = ["start", "mid", "end"];

        if (!validStages.includes(stage)) {
            return res.status(400).json({
                message: "Stage must be start, mid or end",
            });
        }

        const tyreRun = await TyreRun.findOne({
            _id: tyreRunId,
            organisationId,
            isActive: true,
        });

        if (!tyreRun) {
            return res.status(404).json({
                message: "Tyre run not found",
            });
        }

        const resolvedLapNumber = await resolveLatestLapNumber({
            organisationId,
            tyreRunId,
            suppliedLapNumber: lapNumber,
        });

        const pressureCheck = await TyrePressureCheck.create({
            organisationId,
            tyreRunId,
            stage,
            pressurePsi,
            tyreTempC: tyreTempC || undefined,
            rimTempC: rimTempC || undefined,
            lapNumber: resolvedLapNumber,
            recordedAt: recordedAt || new Date(),
            notes: notes || "",
        });

        res.status(201).json({ pressureCheck });
    } catch (err) {
        console.error("createPressureCheck error", err);
        res.status(500).json({ message: "Server error" });
    }
};


// Get pressure checks
exports.getPressureChecks = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { tyreRunId, stage } = req.query;

        const filter = {
            organisationId,
            isActive: true,
        };

        if (tyreRunId) {
            filter.tyreRunId = tyreRunId;
        }

        if (stage) {
            filter.stage = stage;
        }

        const pressureChecks = await TyrePressureCheck.find(filter)
            .sort({ recordedAt: 1, createdAt: 1 });

        res.json({ pressureChecks });
    } catch (err) {
        console.error("getPressureChecks error", err);
        res.status(500).json({ message: "Server error" });
    }
};


// Get one pressure check by ID
exports.getPressureCheckById = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const pressureCheck = await TyrePressureCheck.findOne({
            _id: id,
            organisationId,
            isActive: true,
        });

        if (!pressureCheck) {
            return res.status(404).json({
                message: "Pressure check not found",
            });
        }

        res.json({ pressureCheck });
    } catch (err) {
        console.error("getPressureCheckById error", err);
        res.status(500).json({ message: "Server error" });
    }
};


// Update pressure check
exports.updatePressureCheck = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const pressureCheck = await TyrePressureCheck.findOne({
            _id: id,
            organisationId,
            isActive: true,
        });

        if (!pressureCheck) {
            return res.status(404).json({
                message: "Pressure check not found",
            });
        }

        const allowedFields = [
            "stage",
            "pressurePsi",
            "tyreTempC",
            "rimTempC",
            "lapNumber",
            "recordedAt",
            "notes",
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                pressureCheck[field] = req.body[field];
            }
        }

        if (
            req.body.stage !== undefined &&
            !["start", "mid", "end"].includes(req.body.stage)
        ) {
            return res.status(400).json({
                message: "Stage must be start, mid or end",
            });
        }

        await pressureCheck.save();

        res.json({ pressureCheck });
    } catch (err) {
        console.error("updatePressureCheck error", err);
        res.status(500).json({ message: "Server error" });
    }
};


// Archive pressure check
exports.archivePressureCheck = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const pressureCheck = await TyrePressureCheck.findOneAndUpdate(
            {
                _id: id,
                organisationId,
                isActive: true,
            },
            {
                isActive: false,
            },
            {
                new: true,
            }
        );

        if (!pressureCheck) {
            return res.status(404).json({
                message: "Pressure check not found",
            });
        }

        res.json({
            message: "Pressure check archived",
            pressureCheck,
        });
    } catch (err) {
        console.error("archivePressureCheck error", err);
        res.status(500).json({ message: "Server error" });
    }
};


// Unarchive pressure check
exports.unarchivePressureCheck = async (req, res) => {
    try {
        const organisationId = req.user.organisationId;
        const { id } = req.params;

        const pressureCheck = await TyrePressureCheck.findOneAndUpdate(
            {
                _id: id,
                organisationId,
                isActive: false,
            },
            {
                isActive: true,
            },
            {
                new: true,
            }
        );

        if (!pressureCheck) {
            return res.status(404).json({
                message: "Pressure check not found",
            });
        }

        res.json({
            message: "Pressure check unarchived",
            pressureCheck,
        });
    } catch (err) {
        console.error("unarchivePressureCheck error", err);
        res.status(500).json({ message: "Server error" });
    }
};