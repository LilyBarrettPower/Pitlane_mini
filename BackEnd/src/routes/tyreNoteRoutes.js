const express = require("express");
const authMiddleware = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const tyreNoteController = require("../controllers/tyreNoteController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", requirePermission("trackside"), tyreNoteController.createTyreNote);
router.get("/", tyreNoteController.getTyreNotes);
router.get("/summary", tyreNoteController.getTyreNoteSummary);
router.delete("/:id", requirePermission("trackside"), tyreNoteController.archiveTyreNote);

module.exports = router;