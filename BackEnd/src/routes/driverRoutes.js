const express = require("express");
const driverController = require("../controllers/driverController");
const authMiddleware = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");

const router = express.Router();

router.use(authMiddleware);

router.post("/", requirePermission("manage"), driverController.createDriver);
router.get("/", driverController.getDrivers);
router.get("/:id", driverController.getDriver);
router.patch("/:id", requirePermission("manage"), driverController.updateDriver);
router.delete("/:id", requirePermission("manage"), driverController.deleteDriver);
router.patch("/:id/unarchive", requirePermission("manage"), driverController.unarchiveDriver);

module.exports = router;