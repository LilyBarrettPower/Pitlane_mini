const express = require("express");
const authMiddleware = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const checklistTemplateController = require("../controllers/checklistTemplateController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", requirePermission("manage"), checklistTemplateController.createChecklistTemplate);
router.post("/from-base", requirePermission("manage"), checklistTemplateController.createChecklistTemplateFromBaseTemplate);
router.get("/", checklistTemplateController.getChecklistTemplates);
router.get("/:id", checklistTemplateController.getChecklistTemplateById);
router.patch("/:id", requirePermission("manage"), checklistTemplateController.updateChecklistTemplate);
router.delete("/:id", requirePermission("manage"), checklistTemplateController.archiveChecklistTemplate);
router.patch("/:id/unarchive", requirePermission("manage"), checklistTemplateController.unarchiveChecklistTemplate);

module.exports = router;