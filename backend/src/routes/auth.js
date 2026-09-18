const express = require('express');
const { body } = require('express-validator');
const { registerUser, loginUser, refreshToken } = require('../controllers/authController');
const { validateRequest } = require('../middleware/validate');

const router = express.Router();

router.post(
  '/register',
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be 6 or more characters')
  ],
  validateRequest,
  registerUser
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  validateRequest,
  loginUser
);

router.post('/refresh', refreshToken);

module.exports = router;
