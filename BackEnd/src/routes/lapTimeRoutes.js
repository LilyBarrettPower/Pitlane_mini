const express = require("express");
const authMiddleware = require("../middleware/auth");
const lapTimeController = require("../controllers/lapTimesController");

const router = express.Router();

router.use(authMiddleware);

// Create 
router.post("/", lapTimeController.createLapTime);

// Read
router.get("/", lapTimeController.getLapTimes);
router.get("/:id", lapTimeController.getLapTimeById);

// Update
router.patch("/:id", lapTimeController.updateLapTime);

// Archive
router.delete("/:id", lapTimeController.archiveLapTime);

// Unarchive
router.patch("/:id/unarchive", lapTimeController.unarchiveLapTime);

module.exports = router;