const express = require("express");
const vehicleController = require("../controllers/vehicleController");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.use(authMiddleware);

router.post("/", vehicleController.createVehicle);
router.get("/", vehicleController.getVehicles);
router.get("/:id", vehicleController.getVehicleById);
router.patch("/:id", vehicleController.updateVehicle);
router.delete("/:id", vehicleController.deleteVehicle);
router.patch("/:id/unarchive", vehicleController.unarchiveVehicle);

// Custom setup fields for a vehicle
router.post("/:id/setup-fields", vehicleController.addSetupField);
router.patch("/:id/setup-fields/:fieldId", vehicleController.updateSetupField);
router.delete("/:id/setup-fields/:fieldId", vehicleController.removeSetupField);

module.exports = router;
