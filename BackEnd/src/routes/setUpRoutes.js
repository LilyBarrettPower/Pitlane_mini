const express = require("express");
const authMiddleware = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const setUpController = require("../controllers/setUpController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", requirePermission("setups"), setUpController.createSetUp);
router.get("/", setUpController.getSetUps);
router.get("/:id", setUpController.getSetUpById);
router.patch("/:id", requirePermission("setups"), setUpController.updateSetUp);
router.delete("/:id", requirePermission("manage"), setUpController.archiveSetUp);
router.patch("/:id/unarchive", requirePermission("manage"), setUpController.unarchiveSetUp );

module.exports = router;