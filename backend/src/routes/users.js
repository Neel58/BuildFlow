const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { registerUser, loginUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');

// Auth / Password Reset routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/password-reset', userController.requestPasswordReset);
router.put('/password-reset/verify', userController.verifyPasswordReset);

// User Profile routes (Protected)
router.get('/:id', protect, userController.getUserProfile);
router.put('/:id', protect, userController.updateUserProfile);

// Admin User Management routes
router.get('/', protect, authorize('Admin'), userController.getUsers);
router.put('/:id/role', protect, authorize('Admin'), userController.updateUserRole);
router.put('/:id/deactivate', protect, authorize('Admin'), userController.deactivateUser);
router.delete('/:id', protect, authorize('Admin'), userController.deleteUser);

module.exports = router;
