const express = require("express");
const authMiddleware = require("../middleware/auth");
const tyreNoteController = require("../controllers/tyreNoteController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", tyreNoteController.createTyreNote);
router.get("/", tyreNoteController.getTyreNotes);
router.delete("/:id", tyreNoteController.archiveTyreNote);

module.exports = router;