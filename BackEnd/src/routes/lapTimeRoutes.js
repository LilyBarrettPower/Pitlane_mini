const express = require("express");
const authMiddleware = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const lapTimeController = require("../controllers/lapTimesController");

const router = express.Router();

router.use(authMiddleware);

// Create 
router.post("/", requirePermission("trackside"), lapTimeController.createLapTime);

// Read
router.get("/", lapTimeController.getLapTimes);
router.get("/:id", lapTimeController.getLapTimeById);

// Update
router.patch("/:id", requirePermission("trackside"), lapTimeController.updateLapTime);

// Archive
router.delete("/:id", requirePermission("trackside"), lapTimeController.archiveLapTime);

// Unarchive
router.patch("/:id/unarchive", requirePermission("manage"), lapTimeController.unarchiveLapTime);

module.exports = router;