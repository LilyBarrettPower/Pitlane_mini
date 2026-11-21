const express = require("express");
const authMiddleware = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const issueController = require("../controllers/issueController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", requirePermission("trackside"), issueController.createIssue);
router.get("/", issueController.getIssues);
router.get("/:id", issueController.getIssueById);
router.patch("/:id", requirePermission("trackside"), issueController.updateIssue);
router.delete("/:id", requirePermission("manage"), issueController.archiveIssue);
router.patch("/:id/unarchive", requirePermission("manage"), issueController.unarchiveIssue);

module.exports = router;