const express = require("express");
const authMiddleware = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const tyreController = require("../controllers/tyreController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", requirePermission("manage"), tyreController.createTyre);
router.get("/", tyreController.getTyres);
router.delete("/set", requirePermission("manage"), tyreController.archiveTyreSet);
router.get("/:id", tyreController.getTyreById);
router.patch("/:id", requirePermission("manage"), tyreController.updateTyre);
router.delete("/:id", requirePermission("manage"), tyreController.archiveTyre);
router.patch("/:id/unarchive", requirePermission("manage"), tyreController.unarchiveTyre );

module.exports = router;