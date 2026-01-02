const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getStudentDashboard,
  getLeaveHistory,
  getStudentProfile
} = require('../controllers/studentController');

// Middleware to ensure only students can access these routes
const studentOnly = (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Students only.'
    });
  }
};

// @route   GET /api/student/dashboard
// @desc    Get student dashboard with stats and recent activity
// @access  Private (Student)
router.get('/dashboard', protect, studentOnly, getStudentDashboard);

// @route   GET /api/student/leaves
// @desc    Get student leave history with filters
// @access  Private (Student)
router.get('/leaves', protect, studentOnly, getLeaveHistory);

// @route   GET /api/student/profile
// @desc    Get student profile and statistics
// @access  Private (Student)
router.get('/profile', protect, studentOnly, getStudentProfile);

module.exports = router;
