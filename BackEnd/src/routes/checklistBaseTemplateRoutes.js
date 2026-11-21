const express = require("express");
const authMiddleware = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const checklistBaseTemplateController = require("../controllers/checklistBaseTemplateController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", requirePermission("manage"), checklistBaseTemplateController.createChecklistBaseTemplate);
router.get("/", checklistBaseTemplateController.getChecklistBaseTemplates);
router.get("/:id", checklistBaseTemplateController.getChecklistBaseTemplateById);
router.patch("/:id", requirePermission("manage"), checklistBaseTemplateController.updateChecklistBaseTemplate);
router.delete("/:id", requirePermission("manage"), checklistBaseTemplateController.archiveChecklistBaseTemplate);
router.patch("/:id/unarchive", requirePermission("manage"), checklistBaseTemplateController.unarchiveChecklistBaseTemplate);

module.exports = router;