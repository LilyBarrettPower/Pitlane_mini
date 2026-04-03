const express = require('express');
const authMiddleware = require('../middleware/auth');
const checklistInstanceController = require('../controllers/checklistInstanceController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', checklistInstanceController.createChecklistInstance);
router.post('/from-template', checklistInstanceController.createChecklistInstanceFromTemplate);
router.get('/', checklistInstanceController.getChecklistInstances);
router.get('/:id', checklistInstanceController.getChecklistInstanceById);
router.patch('/:id', checklistInstanceController.updateChecklistInstance);
router.delete('/:id', checklistInstanceController.archiveChecklistInstance);
router.patch('/:id/unarchive', checklistInstanceController.unarchiveChecklistInstance);

module.exports = router;