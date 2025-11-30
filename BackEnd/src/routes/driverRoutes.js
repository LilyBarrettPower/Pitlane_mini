const express = require('express');
const driverController = require('../controllers/driverController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.post('/', driverController.createDriver);
router.get('/', driverController.getDrivers);
router.get('/:id', driverController.getDriver);
router.patch('/:id', driverController.updateDriver);
router.delete('/:id', driverController.deleteDriver);
router.patch('/:id/unarchive', driverController.unarchiveDriver);

module.exports = router;