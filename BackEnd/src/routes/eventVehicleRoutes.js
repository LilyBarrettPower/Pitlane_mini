const express = require('express');
const authMiddleware = require('../middleware/auth');
const EventVehicleController = require('../controllers/EventVehicleController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', EventVehicleController.createAssignment );
router.get('/vehicle/:vehicleId', EventVehicleController.getVehicleForEvent);
router.get('/event/:eventId', EventVehicleController.getEventForVehicle);
router.delete('/:id', EventVehicleController.archiveAssignment);
router.patch('/:id/unarchive', EventVehicleController.unArchiveAssignment);

module.exports = router;