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
// Set (or clear) the one setup a run used
router.put("/run/:runId", RunSetUpController.setSetUpForRun);
// Events a setup has been used at
router.get("/setup/:setUpId/events", RunSetUpController.getSetUpEventHistory);
// Events used at for each of a vehicle's setups, plus the last used setup
router.get("/vehicle/:vehicleId/summary", RunSetUpController.getVehicleSetUpSummary);
// Setups used by a car at one event, with the runs each was used on
router.get("/event-vehicle/:eventVehicleId", RunSetUpController.getSetUpsForEventVehicle);
router.delete("/:id", RunSetUpController.archiveAssignment);
router.patch("/:id/unarchive", RunSetUpController.unArchiveAssignment);

module.exports = router;