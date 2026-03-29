const express = require('express');
const authMiddleware = require('../middleware/auth');
const setUpController = require('../controllers/setUpController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', setUpController.createSetUp);
router.get('/', setUpController.getSetUps);
router.get('/:id', setUpController.getSetUpById);
router.patch('/:id', setUpController.updateSetUp);
router.delete('/:id', setUpController.archiveSetUp);
router.patch('/:id/unarchive', setUpController.unarchiveSetUp );

module.exports = router;