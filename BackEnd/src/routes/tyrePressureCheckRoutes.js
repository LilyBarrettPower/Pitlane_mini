const express = require("express");
const authMiddleware = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const tyrePressureCheckController = require("../controllers/tyrePressureCheckController");

const router = express.Router();
router.use(authMiddleware);

router.post("/", requirePermission("trackside"), tyrePressureCheckController.createPressureCheck);
router.get("/", tyrePressureCheckController.getPressureChecks);
router.get("/:id", tyrePressureCheckController.getPressureCheckById);
router.patch("/:id", requirePermission("trackside"), tyrePressureCheckController.updatePressureCheck);
router.delete("/:id", requirePermission("trackside"), tyrePressureCheckController.archivePressureCheck);
router.patch("/:id/unarchive", requirePermission("manage"), tyrePressureCheckController.unarchivePressureCheck);

module.exports = router;