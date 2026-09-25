const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const crypto = require('crypto');

// Request password reset token
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and store in database
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire to 10 minutes
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    res.json({
      message: 'Password reset token generated',
      resetToken
    });
  } catch (error) {
    next(error);
  }
};

// Verify OTP/token and reset password
exports.verifyPasswordReset = async (req, res, next) => {
  try {
    const { token, resetToken, newPassword, password } = req.body;
    const rawToken = token || resetToken;
    const targetPassword = newPassword || password;

    if (!rawToken || !targetPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired password reset token' });
    }

    // Set new password
    user.password = targetPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Retrieve user profile
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Ensure users can only update their own profile unless Admin
    if (req.user.role !== 'Admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized to update this profile' });
    }

    const { firstName, lastName, email, address } = req.body;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (address) user.address = address;

    const updatedUser = await user.save();
    const safeUser = updatedUser.toObject();
    delete safeUser.password;
    delete safeUser.refreshToken;
    res.json(safeUser);
  } catch (error) {
    next(error);
  }
};

// Admin: List all users, filterable by role
exports.getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role) {
      query.role = role;
    }

    const users = await User.find(query).select('-password -refreshToken');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Admin: Change user role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ message: 'Role is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // Log to AuditLog
    await AuditLog.create({
      action: 'USER_ROLE_CHANGE',
      actor: req.user._id,
      targetId: user._id,
      entityType: 'User',
      changes: { oldRole, newRole: role },
      description: `User ${user.email} role updated from ${oldRole} to ${role}`
    });

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    next(error);
  }
};

// Admin: Deactivate user account
exports.deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = false;
    await user.save();

    await AuditLog.create({
      action: 'USER_DEACTIVATE',
      actor: req.user._id,
      targetId: user._id,
      entityType: 'User',
      description: `User ${user.email} account deactivated`
    });

    res.json({ message: 'User account deactivated successfully', user });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete user account
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await AuditLog.create({
      action: 'USER_DELETE',
      actor: req.user._id,
      targetId: req.params.id,
      entityType: 'User',
      description: `User ${user.email} deleted`
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
