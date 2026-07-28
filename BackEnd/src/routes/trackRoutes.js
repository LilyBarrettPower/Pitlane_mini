const express = require("express");
const authMiddleware = require("../middleware/auth");
const trackController = require("../controllers/trackController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", trackController.createTrack);
router.get("/", trackController.getTracks);
router.get("/:id", trackController.getTrackById);
router.patch("/:id", trackController.updateTrack);
router.delete("/:id", trackController.archiveTrack);
router.patch("/:id/unarchive", trackController.unarchiveTrack)

module.exports = router;