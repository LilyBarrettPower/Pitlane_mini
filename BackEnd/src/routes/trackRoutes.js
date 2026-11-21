const express = require("express");
const authMiddleware = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const trackController = require("../controllers/trackController");

const router = express.Router();

router.use(authMiddleware);

// Built-in track library (must come before "/:id")
router.get("/library", trackController.getTrackLibrary);
router.post("/from-library", requirePermission("manage"), trackController.addTrackFromLibrary);

router.post("/", requirePermission("manage"), trackController.createTrack);
router.get("/", trackController.getTracks);
router.get("/:id", trackController.getTrackById);
router.patch("/:id", requirePermission("manage"), trackController.updateTrack);
router.delete("/:id", requirePermission("manage"), trackController.archiveTrack);
router.patch("/:id/unarchive", requirePermission("manage"), trackController.unarchiveTrack);

module.exports = router;
