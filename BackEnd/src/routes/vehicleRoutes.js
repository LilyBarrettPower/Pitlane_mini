const express = require("express");
const vehicleController = require("../controllers/vehicleController");
const authMiddleware = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");

const router = express.Router();

router.use(authMiddleware);

router.post("/", requirePermission("manage"), vehicleController.createVehicle);
router.get("/", vehicleController.getVehicles);
router.get("/:id", vehicleController.getVehicleById);
router.patch("/:id", requirePermission("manage"), vehicleController.updateVehicle);
router.delete("/:id", requirePermission("manage"), vehicleController.deleteVehicle);
router.patch("/:id/unarchive", requirePermission("manage"), vehicleController.unarchiveVehicle);

// Custom setup fields for a vehicle
router.post("/:id/setup-fields", requirePermission("setups"), vehicleController.addSetupField);
router.patch("/:id/setup-fields/:fieldId", requirePermission("setups"), vehicleController.updateSetupField);
router.delete("/:id/setup-fields/:fieldId", requirePermission("setups"), vehicleController.removeSetupField);

module.exports = router;
