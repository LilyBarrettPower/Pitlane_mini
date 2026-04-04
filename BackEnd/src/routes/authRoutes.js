const express = require('express');
const authMiddleware = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router()

router.post('/register-organisation', authController.registerOrganisation);
router.post('/create-user', authController.createUser);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;

