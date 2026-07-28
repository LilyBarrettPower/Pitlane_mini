const express = require("express");
const authMiddleware = require("../middleware/auth");
const RunSetUpController = require("../controllers/runSetUpController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", RunSetUpController.createAssignment);
// Return setup that this run used
router.get("/setup/:runId", RunSetUpController.getSetUpForRun);
//  Get a list of runs that this setup was used in
router.get("/run/:setUpId", RunSetUpController.getRunsForSetUp);
router.delete("/:id", RunSetUpController.archiveAssignment);
router.patch("/:id/unarchive", RunSetUpController.unArchiveAssignment);

module.exports = router;