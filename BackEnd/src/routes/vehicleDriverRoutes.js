const express = require('express');
const authMiddleware = require('../middleware/auth');
const VehicleDriverController = require('../controllers/vehicleDriverController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', VehicleDriverController.createAssignment);
router.get('/vehicle/:vehicleId', VehicleDriverController.getDriverForVehicle);
router.get('/driver/:driverId', VehicleDriverController.getVehicleForDriver);
router.delete('/:id', VehicleDriverController.archiveAssignment);
router.post('/:id/unarchive', VehicleDriverController.unArchiveAssignment);

module.exports = router;