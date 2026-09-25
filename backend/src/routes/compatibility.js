const express = require('express');
const router = express.Router();
const compatibilityController = require('../controllers/compatibilityController');

// POST /api/compatibility
router.post('/', compatibilityController.checkCompatibility);

module.exports = router;
