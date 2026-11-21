const express = require("express");
const authMiddleware = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const runController = require("../controllers/runController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", requirePermission("trackside"), runController.createRun);
router.get("/", runController.getRuns);
router.get("/:id", runController.getRunById);
router.patch("/:id/car-in", requirePermission("trackside"), runController.carIn);
router.patch("/:id", requirePermission("trackside"), runController.updateRun);
router.delete("/:id", requirePermission("manage"), runController.archiveRun);
router.patch("/:id/unarchive", requirePermission("manage"), runController.unarchiveRun );

module.exports = router;