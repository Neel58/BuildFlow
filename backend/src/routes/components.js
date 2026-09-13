const express = require('express');
const { getComponents, getComponentById } = require('../controllers/componentController');

const router = express.Router();

router.get('/', getComponents);
router.get('/:id', getComponentById);

module.exports = router;
