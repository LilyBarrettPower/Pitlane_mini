const express = require("express");
const authMiddleware = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const VehicleDriverController = require("../controllers/vehicleDriverController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", requirePermission("manage"), VehicleDriverController.createAssignment);
router.get("/vehicle/:vehicleId", VehicleDriverController.getDriverForVehicle);
router.get("/driver/:driverId", VehicleDriverController.getVehicleForDriver);
router.delete("/:id", requirePermission("manage"), VehicleDriverController.archiveAssignment);
router.patch("/:id/unarchive", requirePermission("manage"), VehicleDriverController.unArchiveAssignment);

module.exports = router;
