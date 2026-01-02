const express = require('express');
const router = express.Router();
const {
  getAllLeaveRequests,
  approveLeave,
  rejectLeave,
  viewAnalytics,
  getDashboardSummary,
  getAllStudents
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard summary
// @access  Private (Admin)
router.get('/dashboard', protect, adminOnly, getDashboardSummary);

// @route   GET /api/admin/analytics
// @desc    Get analytics and statistics
// @access  Private (Admin)
router.get('/analytics', protect, adminOnly, viewAnalytics);

// @route   GET /api/admin/students
// @desc    Get all students
// @access  Private (Admin)
router.get('/students', protect, adminOnly, getAllStudents);

// @route   GET /api/admin/leaves
// @desc    Get all leave applications
// @access  Private (Admin)
router.get('/leaves', protect, adminOnly, getAllLeaveRequests);

// @route   PUT /api/admin/leaves/:id/approve
// @desc    Approve leave application
// @access  Private (Admin)
router.put('/leaves/:id/approve', protect, adminOnly, approveLeave);

// @route   PUT /api/admin/leaves/:id/reject
// @desc    Reject leave application
// @access  Private (Admin)
router.put('/leaves/:id/reject', protect, adminOnly, rejectLeave);

module.exports = router;
