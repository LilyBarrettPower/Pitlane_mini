const express = require("express");
const authMiddleware = require("../middleware/auth");
const tyreRunController = require("../controllers/tyreRunController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", tyreRunController.createTyreRun);
router.get("/", tyreRunController.getTyreRuns);
router.get("/:id", tyreRunController.getTyreRunById);
router.patch("/:id", tyreRunController.updateTyreRun);
router.delete("/:id", tyreRunController.archiveTyreRun);
router.patch("/:id/unarchive", tyreRunController.unarchiveTyreRun );

module.exports = router;