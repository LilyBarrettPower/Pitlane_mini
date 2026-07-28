const express = require("express");
const authMiddleware = require("../middleware/auth");
const tyreController = require("../controllers/tyreController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", tyreController.createTyre);
router.get("/", tyreController.getTyres);
router.get("/:id", tyreController.getTyreById);
router.patch("/:id", tyreController.updateTyre);
router.delete("/:id", tyreController.archiveTyre);
router.patch("/:id/unarchive", tyreController.unarchiveTyre );

module.exports = router;