const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getStudentLeaves,
  getAllLeaves,
  getLeaveById,
  updateLeaveStatus,
  deleteLeave
} = require('../controllers/leaveController');
const { protect, studentOnly, adminOnly } = require('../middleware/auth');

// @route   POST /api/leave/apply
// @desc    Apply for leave
// @access  Private (Student)
router.post('/apply', protect, studentOnly, applyLeave);

// @route   GET /api/leave/my-leaves
// @desc    Get user's leave applications
// @access  Private (Student)
router.get('/my-leaves', protect, studentOnly, getStudentLeaves);

// @route   GET /api/leave/all
// @desc    Get all leave applications
// @access  Private (Admin)
router.get('/all', protect, adminOnly, getAllLeaves);

// @route   GET /api/leave/:id
// @desc    Get leave by ID
// @access  Private
router.get('/:id', protect, getLeaveById);

// @route   PUT /api/leave/:id/status
// @desc    Update leave status (approve/reject)
// @access  Private (Admin)
router.put('/:id/status', protect, adminOnly, updateLeaveStatus);

// @route   DELETE /api/leave/:id
// @desc    Delete leave application
// @access  Private (Student - Own leaves only, Admin - All)
router.delete('/:id', protect, deleteLeave);

module.exports = router;
