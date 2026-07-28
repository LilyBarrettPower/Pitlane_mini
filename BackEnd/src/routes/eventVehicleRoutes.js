const express = require("express");
const authMiddleware = require("../middleware/auth");
const EventVehicleController = require("../controllers/eventVehicleController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", EventVehicleController.createAssignment);
// Return a list of events that this vehicle has/ is attending
router.get("/event/:vehicleId", EventVehicleController.getEventForVehicle);
//  Get a list of vehicles that are attending/ did attend an event
router.get("/vehicle/:eventId", EventVehicleController.getVehicleForEvent);
router.delete("/:id", EventVehicleController.archiveAssignment);
router.patch("/:id/unarchive", EventVehicleController.unArchiveAssignment);

module.exports = router;