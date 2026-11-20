const express = require("express");
const authMiddleware = require("../middleware/auth");
const trackController = require("../controllers/trackController");

const router = express.Router();

router.use(authMiddleware);

// Built-in track library (must come before "/:id")
router.get("/library", trackController.getTrackLibrary);
router.post("/from-library", trackController.addTrackFromLibrary);

router.post("/", trackController.createTrack);
router.get("/", trackController.getTracks);
router.get("/:id", trackController.getTrackById);
router.patch("/:id", trackController.updateTrack);
router.delete("/:id", trackController.archiveTrack);
router.patch("/:id/unarchive", trackController.unarchiveTrack);

module.exports = router;
