const express = require("express");
const authMiddleware = require("../middleware/auth");
const runController = require("../controllers/runController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", runController.createRun);
router.get("/", runController.getRuns);
router.get("/:id", runController.getRunById);
router.patch("/:id/car-in", runController.carIn);
router.patch("/:id", runController.updateRun);
router.delete("/:id", runController.archiveRun);
router.patch("/:id/unarchive", runController.unarchiveRun );

module.exports = router;