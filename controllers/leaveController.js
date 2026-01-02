const Leave = require('../models/Leave');
const User = require('../models/User');

// @desc    Apply for leave (Student)
// @route   POST /api/leave/apply
// @access  Private (Student)
const applyLeave = async (req, res) => {
  try {
    const { fromDate, toDate, reason } = req.body;

    // Validation
    if (!fromDate || !toDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Please provide fromDate, toDate, and reason'
      });
    }

    // Check if dates are valid
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (from < today) {
      return res.status(400).json({
        success: false,
        message: 'From date cannot be in the past'
      });
    }

    if (to < from) {
      return res.status(400).json({
        success: false,
        message: 'To date must be after from date'
      });
    }

    // Check if student already has a pending/testing leave for overlapping dates
    const existingLeave = await Leave.findOne({
      studentId: req.user._id,
      status: { $in: ['pending', 'testing'] },
      $or: [
        { fromDate: { $lte: to }, toDate: { $gte: from } }
      ]
    });

    if (existingLeave) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending/testing leave application for overlapping dates'
      });
    }

    // Create leave application with status 'testing'
    const leave = await Leave.create({
      studentId: req.user._id,
      fromDate: from,
      toDate: to,
      reason,
      status: 'testing' // Auto-set to testing after submission
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully. Status set to testing.',
      data: leave
    });

  } catch (error) {
    console.error('Apply leave error:', error);

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages[0] || 'Validation error'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error submitting leave application',
      error: error.message
    });
  }
};

// @desc    Get student's own leaves
// @route   GET /api/leave/my-leaves
// @access  Private (Student)
const getStudentLeaves = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { studentId: req.user._id };
    
    if (status) {
      query.status = status;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get leaves with pagination
    const leaves = await Leave.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Leave.countDocuments(query);

    res.status(200).json({
      success: true,
      count: leaves.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: leaves
    });

  } catch (error) {
    console.error('Get student leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaves',
      error: error.message
    });
  }
};

// @desc    Get all leaves (Admin)
// @route   GET /api/leave/all
// @access  Private (Admin)
const getAllLeaves = async (req, res) => {
  try {
    const { status, studentId, page = 1, limit = 10 } = req.query;

    // Build query
    const query = {};
    
    if (status) {
      query.status = status;
    }

    if (studentId) {
      query.studentId = studentId;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get leaves with pagination
    const leaves = await Leave.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Leave.countDocuments(query);

    res.status(200).json({
      success: true,
      count: leaves.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: leaves
    });

  } catch (error) {
    console.error('Get all leaves error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leaves',
      error: error.message
    });
  }
};

// @desc    Get leave by ID
// @route   GET /api/leave/:id
// @access  Private
const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    // Check if student is accessing their own leave or admin
    if (req.user.role !== 'admin' && leave.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this leave application'
      });
    }

    res.status(200).json({
      success: true,
      data: leave
    });

  } catch (error) {
    console.error('Get leave by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave',
      error: error.message
    });
  }
};

// @desc    Update leave status (Admin)
// @route   PUT /api/leave/:id/status
// @access  Private (Admin)
const updateLeaveStatus = async (req, res) => {
  try {
    const { status, adminComment } = req.body;

    // Validation
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status'
      });
    }

    // Validate status
    const validStatuses = ['pending', 'testing', 'approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: pending, testing, approved, rejected'
      });
    }

    // Find leave
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    // Update leave status
    leave.status = status;
    
    if (adminComment) {
      leave.adminComment = adminComment;
    }

    // If approved or rejected, add admin info
    if (status === 'approved' || status === 'rejected') {
      leave.approvedBy = req.user._id;
      leave.approvedAt = Date.now();
    }

    await leave.save();

    res.status(200).json({
      success: true,
      message: `Leave application ${status} successfully`,
      data: leave
    });

  } catch (error) {
    console.error('Update leave status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating leave status',
      error: error.message
    });
  }
};

// @desc    Delete leave application
// @route   DELETE /api/leave/:id
// @access  Private (Student - own leaves only, Admin - all)
const deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    // Check if student is deleting their own leave or admin
    if (req.user.role !== 'admin' && leave.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this leave application'
      });
    }

    // Students can only delete pending/testing leaves
    if (req.user.role === 'student' && !['pending', 'testing'].includes(leave.status)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete approved/rejected leave applications'
      });
    }

    await leave.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Leave application deleted successfully',
      data: {}
    });

  } catch (error) {
    console.error('Delete leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting leave',
      error: error.message
    });
  }
};

module.exports = {
  applyLeave,
  getStudentLeaves,
  getAllLeaves,
  getLeaveById,
  updateLeaveStatus,
  deleteLeave
};
