const express = require("express");
const authMiddleware = require("../middleware/auth");
const issueController = require("../controllers/issueController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", issueController.createIssue);
router.get("/", issueController.getIssues);
router.get("/:id", issueController.getIssueById);
router.patch("/:id", issueController.updateIssue);
router.delete("/:id", issueController.archiveIssue);
router.patch("/:id/unarchive", issueController.unarchiveIssue);

module.exports = router;