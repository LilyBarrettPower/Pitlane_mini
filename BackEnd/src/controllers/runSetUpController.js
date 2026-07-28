const RunSetUp = require("../models/RunSetUp");
const Run = require("../models/Run");
const SetUp = require("../models/SetUp");

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

        console.log("createAssignment body:", {
            organisationId: req.user.organisationId,
            runId,
            setUpId,
        });

        const run = await Run.findOne({ _id: runId, organisationId });
        console.log("Found the run", run);

        if (!run) {
            return res.status(404).json({ message: "Run not found" });
        }

        let setUp = await SetUp.findOne({ _id: setUpId, organisationId });
        console.log("Found the setUp:", setUp);

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
