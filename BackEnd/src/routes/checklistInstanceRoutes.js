const express = require("express");
const authMiddleware = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const checklistInstanceController = require("../controllers/checklistInstanceController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", requirePermission("trackside"), checklistInstanceController.createChecklistInstance);
router.post("/from-template", requirePermission("trackside"), checklistInstanceController.createChecklistInstanceFromTemplate);
router.get("/", checklistInstanceController.getChecklistInstances);
router.get("/:id", checklistInstanceController.getChecklistInstanceById);
router.patch("/:id", requirePermission("trackside"), checklistInstanceController.updateChecklistInstance);
router.delete("/:id", requirePermission("manage"), checklistInstanceController.archiveChecklistInstance);
router.patch("/:id/unarchive", requirePermission("manage"), checklistInstanceController.unarchiveChecklistInstance);

module.exports = router;