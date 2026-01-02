const Leave = require('../models/Leave');
const User = require('../models/User');
const TestResult = require('../models/TestResult');

// @desc    Get all leave requests
// @route   GET /api/admin/leaves
// @access  Private (Admin)
const getAllLeaveRequests = async (req, res) => {
  try {
    const { status, studentId, page = 1, limit = 20, sortBy = 'createdAt', order = 'desc' } = req.query;

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

    // Sort order
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    // Get leaves with pagination and sorting
    const leaves = await Leave.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Leave.countDocuments(query);

    // Get statistics
    const stats = {
      pending: await Leave.countDocuments({ status: 'pending' }),
      testing: await Leave.countDocuments({ status: 'testing' }),
      approved: await Leave.countDocuments({ status: 'approved' }),
      rejected: await Leave.countDocuments({ status: 'rejected' })
    };

    res.status(200).json({
      success: true,
      count: leaves.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      stats,
      data: leaves
    });

  } catch (error) {
    console.error('Get all leave requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave requests',
      error: error.message
    });
  }
};

// @desc    Approve leave request
// @route   PUT /api/admin/leaves/:id/approve
// @access  Private (Admin)
const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComment } = req.body;

    // Find leave
    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if leave can be approved (should be in testing status)
    if (leave.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Leave request is already approved'
      });
    }

    // Check if test exists and student passed
    const testResult = await TestResult.findOne({ leaveId: id });
    
    if (!testResult) {
      return res.status(400).json({
        success: false,
        message: 'Cannot approve: Student has not completed the test'
      });
    }

    if (testResult.result !== 'pass') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve: Student failed the test (Score: ${testResult.finalScore}%)`,
        testResult: {
          mcqScore: testResult.mcqScore,
          codingScore: testResult.codingScore,
          finalScore: testResult.finalScore,
          result: testResult.result
        }
      });
    }

    // Update leave status
    leave.status = 'approved';
    leave.approvedBy = req.user._id;
    leave.approvedAt = Date.now();
    
    if (adminComment) {
      leave.adminComment = adminComment;
    }

    await leave.save();

    res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
      data: leave
    });

  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving leave request',
      error: error.message
    });
  }
};

// @desc    Reject leave request
// @route   PUT /api/admin/leaves/:id/reject
// @access  Private (Admin)
const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminComment } = req.body;

    // Validation
    if (!adminComment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a reason for rejection in adminComment'
      });
    }

    // Find leave
    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if already rejected
    if (leave.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Leave request is already rejected'
      });
    }

    // Check if already approved
    if (leave.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reject an approved leave request'
      });
    }

    // Update leave status
    leave.status = 'rejected';
    leave.approvedBy = req.user._id;
    leave.approvedAt = Date.now();
    leave.adminComment = adminComment;

    await leave.save();

    res.status(200).json({
      success: true,
      message: 'Leave request rejected successfully',
      data: leave
    });

  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting leave request',
      error: error.message
    });
  }
};

// @desc    View analytics and statistics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const viewAnalytics = async (req, res) => {
  try {
    // 1. User Statistics
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    // 2. Leave Statistics
    const totalLeaves = await Leave.countDocuments();
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    const testingLeaves = await Leave.countDocuments({ status: 'testing' });
    const approvedLeaves = await Leave.countDocuments({ status: 'approved' });
    const rejectedLeaves = await Leave.countDocuments({ status: 'rejected' });

    // 3. Test Statistics
    const totalTests = await TestResult.countDocuments();
    const passedTests = await TestResult.countDocuments({ result: 'pass' });
    const failedTests = await TestResult.countDocuments({ result: 'fail' });
    const passRate = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    // 4. Average Scores
    const testResults = await TestResult.find();
    let totalMCQScore = 0;
    let totalCodingScore = 0;
    let totalFinalScore = 0;

    testResults.forEach(result => {
      totalMCQScore += result.mcqScore || 0;
      totalCodingScore += result.codingScore || 0;
      totalFinalScore += result.finalScore || 0;
    });

    const averageMCQScore = totalTests > 0 ? Math.round(totalMCQScore / totalTests) : 0;
    const averageCodingScore = totalTests > 0 ? Math.round(totalCodingScore / totalTests) : 0;
    const averageFinalScore = totalTests > 0 ? Math.round(totalFinalScore / totalTests) : 0;

    // 5. Recent Activity
    const recentLeaves = await Leave.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('studentId fromDate toDate status createdAt');

    const recentTests = await TestResult.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('leaveId mcqScore codingScore finalScore result createdAt')
      .populate({
        path: 'leaveId',
        select: 'studentId',
        populate: {
          path: 'studentId',
          select: 'name email'
        }
      });

    // 6. Students with most leaves
    const studentLeaveStats = await Leave.aggregate([
      {
        $group: {
          _id: '$studentId',
          totalLeaves: { $sum: 1 },
          approvedLeaves: {
            $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
          },
          rejectedLeaves: {
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          }
        }
      },
      { $sort: { totalLeaves: -1 } },
      { $limit: 10 }
    ]);

    // Populate student details
    const studentIds = studentLeaveStats.map(stat => stat._id);
    const students = await User.find({ _id: { $in: studentIds } }).select('name email');
    
    const topStudents = studentLeaveStats.map(stat => {
      const student = students.find(s => s._id.toString() === stat._id.toString());
      return {
        student: student ? { name: student.name, email: student.email } : null,
        totalLeaves: stat.totalLeaves,
        approvedLeaves: stat.approvedLeaves,
        rejectedLeaves: stat.rejectedLeaves
      };
    });

    // 7. Monthly trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyLeaves = await Leave.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      message: 'Analytics data fetched successfully',
      data: {
        users: {
          totalStudents,
          totalAdmins,
          totalUsers: totalStudents + totalAdmins
        },
        leaves: {
          total: totalLeaves,
          pending: pendingLeaves,
          testing: testingLeaves,
          approved: approvedLeaves,
          rejected: rejectedLeaves,
          approvalRate: totalLeaves > 0 ? Math.round((approvedLeaves / totalLeaves) * 100) : 0,
          rejectionRate: totalLeaves > 0 ? Math.round((rejectedLeaves / totalLeaves) * 100) : 0
        },
        tests: {
          total: totalTests,
          passed: passedTests,
          failed: failedTests,
          passRate: passRate + '%',
          averageScores: {
            mcq: averageMCQScore + '%',
            coding: averageCodingScore + '%',
            final: averageFinalScore + '%'
          }
        },
        recentActivity: {
          recentLeaves,
          recentTests
        },
        topStudents,
        monthlyTrends: monthlyLeaves
      }
    });

  } catch (error) {
    console.error('View analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

// @desc    Get dashboard summary
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboardSummary = async (req, res) => {
  try {
    // Quick summary for dashboard
    const summary = {
      students: await User.countDocuments({ role: 'student' }),
      pendingLeaves: await Leave.countDocuments({ status: 'pending' }),
      testingLeaves: await Leave.countDocuments({ status: 'testing' }),
      totalTests: await TestResult.countDocuments(),
      passedTests: await TestResult.countDocuments({ result: 'pass' })
    };

    // Recent pending leaves (need immediate attention)
    const urgentLeaves = await Leave.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      message: 'Dashboard summary fetched successfully',
      data: {
        summary,
        urgentLeaves
      }
    });

  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard summary',
      error: error.message
    });
  }
};

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private (Admin)
const getAllStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    // Build query
    const query = { role: 'student' };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get students
    const students = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get statistics for each student
    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        const leaveCount = await Leave.countDocuments({ studentId: student._id });
        const approvedLeaves = await Leave.countDocuments({ 
          studentId: student._id, 
          status: 'approved' 
        });
        const testsTaken = await TestResult.countDocuments({ 
          leaveId: { $in: await Leave.find({ studentId: student._id }).distinct('_id') }
        });

        return {
          ...student.toObject(),
          stats: {
            totalLeaves: leaveCount,
            approvedLeaves,
            testsTaken
          }
        };
      })
    );

    // Get total count
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      count: students.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: studentsWithStats
    });

  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
};

module.exports = {
  getAllLeaveRequests,
  approveLeave,
  rejectLeave,
  viewAnalytics,
  getDashboardSummary,
  getAllStudents
};
