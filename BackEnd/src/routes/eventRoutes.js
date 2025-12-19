const express = require('express');
const authMiddleware = require('../middleware/auth');
const eventController = require('../controllers/eventController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', eventController.createEvent);
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);
router.patch('/:id', eventController.updateEvent);
router.delete('/:id', eventController.archiveEvent);
router.patch('/:id/unarchive', eventController.unarchiveEvent)

module.exports = router;