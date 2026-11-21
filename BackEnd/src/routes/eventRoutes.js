const express = require("express");
const authMiddleware = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const eventController = require("../controllers/eventController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", requirePermission("manage"), eventController.createEvent);
router.get("/", eventController.getEvents);
router.get("/:id", eventController.getEventById);
router.patch("/:id", requirePermission("manage"), eventController.updateEvent);
router.delete("/:id", requirePermission("manage"), eventController.archiveEvent);
router.patch("/:id/unarchive", requirePermission("manage"), eventController.unarchiveEvent);

module.exports = router;