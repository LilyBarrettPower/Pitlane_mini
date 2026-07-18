const express = require("express");
const authMiddleware = require("../middleware/auth");
const tyrePressureCheckController = require("../controllers/tyrePressureCheckController");

const router = express.Router();
router.use(authMiddleware);

router.post("/", tyrePressureCheckController.createPressureCheck);
router.get("/", tyrePressureCheckController.getPressureChecks);
router.get("/:id", tyrePressureCheckController.getPressureCheckById);
router.patch("/:id", tyrePressureCheckController.updatePressureCheck);
router.delete("/:id", tyrePressureCheckController.archivePressureCheck);
router.patch("/:id/unarchive", tyrePressureCheckController.unarchivePressureCheck);

module.exports = router;