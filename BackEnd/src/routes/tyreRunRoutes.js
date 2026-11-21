const express = require("express");
const authMiddleware = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const tyreRunController = require("../controllers/tyreRunController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", requirePermission("trackside"), tyreRunController.createTyreRun);
router.get("/", tyreRunController.getTyreRuns);
router.get("/history", tyreRunController.getTyreSetHistory);
router.get("/event-vehicle/:eventVehicleId/history", tyreRunController.getTyreHistoryForEventVehicle);
router.get("/tyre/:tyreId/events", tyreRunController.getTyreEventHistory);
router.get("/:id", tyreRunController.getTyreRunById);
router.patch("/:id", requirePermission("trackside"), tyreRunController.updateTyreRun);
router.delete("/:id", requirePermission("trackside"), tyreRunController.archiveTyreRun);
router.patch("/:id/unarchive", requirePermission("manage"), tyreRunController.unarchiveTyreRun );

module.exports = router;