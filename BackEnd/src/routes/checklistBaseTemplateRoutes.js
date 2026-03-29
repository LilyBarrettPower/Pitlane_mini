const express = require('express');
const authMiddleware = require('../middleware/auth');
const checklistBaseTemplateController = require('../controllers/checklistBaseTemplateController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', checklistBaseTemplateController.createChecklistBaseTemplate);
router.get('/', checklistBaseTemplateController.getChecklistBaseTemplates);
router.get('/:id', checklistBaseTemplateController.getChecklistBaseTemplateById);
router.patch('/:id', checklistBaseTemplateController.updateChecklistBaseTemplate);
router.delete('/:id', checklistBaseTemplateController.archiveChecklistBaseTemplate);
router.patch('/:id/unarchive', checklistBaseTemplateController.unarchiveChecklistBaseTemplate);

module.exports = router;