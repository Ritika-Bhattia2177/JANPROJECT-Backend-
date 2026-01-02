const User = require('../models/User');
const { sendTokenResponse } = require('../utils/jwt');
const { 
  sendSuccessResponse, 
  sendErrorResponse, 
  STATUS_CODES, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES 
} = require('../utils/apiResponse');

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation - Check required fields
    if (!name || !email || !password) {
      return sendErrorResponse(
        res, 
        STATUS_CODES.BAD_REQUEST, 
        'Please provide name, email and password'
      );
    }

    // Check if email format is valid
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return sendErrorResponse(
        res, 
        STATUS_CODES.BAD_REQUEST, 
        'Please provide a valid email address'
      );
    }

    // Check password length
    if (password.length < 6) {
      return sendErrorResponse(
        res, 
        STATUS_CODES.BAD_REQUEST, 
        'Password must be at least 6 characters long'
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendErrorResponse(
        res, 
        STATUS_CODES.CONFLICT, 
        'Email already registered. Please use a different email or login.'
      );
    }

    // Only allow student registration (admin must be created manually)
    const userRole = role === 'admin' ? 'student' : (role || 'student');

    // Create user (password will be hashed automatically by pre-save hook in User model)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password, // Will be hashed by bcrypt pre-save hook
      role: userRole
    });

    // Send token response with user data
    sendTokenResponse(user, 201, res, SUCCESS_MESSAGES.REGISTER_SUCCESS);

  } catch (error) {
    console.error('Register error:', error);
    
    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return sendErrorResponse(
        res, 
        STATUS_CODES.BAD_REQUEST, 
        messages[0] || ERROR_MESSAGES.VALIDATION_ERROR
      );
    }

    // Handle duplicate key error (11000)
    if (error.code === 11000) {
      return sendErrorResponse(
        res, 
        STATUS_CODES.CONFLICT, 
        'Email already registered'
      );
    }

    // Generic server error
    sendErrorResponse(
      res, 
      STATUS_CODES.INTERNAL_SERVER_ERROR, 
      ERROR_MESSAGES.SERVER_ERROR
    );
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation - Check required fields
    if (!email || !password) {
      return sendErrorResponse(
        res,
        STATUS_CODES.BAD_REQUEST,
        'Please provide email and password'
      );
    }

    // Check if user exists (include password for comparison using select)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return sendErrorResponse(
        res,
        STATUS_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.INVALID_CREDENTIALS
      );
    }

    // Verify password using bcrypt comparison
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      return sendErrorResponse(
        res,
        STATUS_CODES.UNAUTHORIZED,
        ERROR_MESSAGES.INVALID_CREDENTIALS
      );
    }

    // Generate JWT token with userId and role, then send response
    sendTokenResponse(user, STATUS_CODES.OK, res, SUCCESS_MESSAGES.LOGIN_SUCCESS);

  } catch (error) {
    console.error('Login error:', error);
    sendErrorResponse(
      res,
      STATUS_CODES.INTERNAL_SERVER_ERROR,
      ERROR_MESSAGES.SERVER_ERROR
    );
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      data: {}
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message
    });
  }
};

// @desc    Update user password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isPasswordMatch = await user.comparePassword(currentPassword);
    
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send token response
    sendTokenResponse(user, 200, res, 'Password updated successfully');

  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  updatePassword
};
