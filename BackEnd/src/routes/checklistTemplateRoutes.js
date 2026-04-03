const express = require('express');
const authMiddleware = require('../middleware/auth');
const checklistTemplateController = require('../controllers/checklistTemplateController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', checklistTemplateController.createChecklistTemplate);
router.post('/from-base', checklistTemplateController.createChecklistTemplateFromBaseTemplate);
router.get('/', checklistTemplateController.getChecklistTemplates);
router.get('/:id', checklistTemplateController.getChecklistTemplateById);
router.patch('/:id', checklistTemplateController.updateChecklistTemplate);
router.delete('/:id', checklistTemplateController.archiveChecklistTemplate);
router.patch('/:id/unarchive', checklistTemplateController.unarchiveChecklistTemplate);

module.exports = router;