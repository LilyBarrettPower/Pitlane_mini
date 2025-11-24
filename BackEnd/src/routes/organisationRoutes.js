const express = require('express');
const authMiddleware = require('../middleware/auth');
const organisationController = require('../controllers/organisationController');

const router = express.Router();

router.get(
    '/me',
    authMiddleware,
    organisationController.getMyOrganisation
);

module.exports = router;