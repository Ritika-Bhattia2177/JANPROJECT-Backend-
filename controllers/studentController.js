const Leave = require('../models/Leave');
const TestResult = require('../models/TestResult');
const User = require('../models/User');

// @desc    Get student dashboard data
// @route   GET /api/student/dashboard
// @access  Private (Student)
const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user._id;

    // 1. Get leave statistics
    const totalLeaves = await Leave.countDocuments({ studentId });
    const approvedLeaves = await Leave.countDocuments({ studentId, status: 'approved' });
    const pendingLeaves = await Leave.countDocuments({ studentId, status: 'pending' });
    const rejectedLeaves = await Leave.countDocuments({ studentId, status: 'rejected' });
    const testingLeaves = await Leave.countDocuments({ studentId, status: 'testing' });

    // Available leaves (assuming 12 per year)
    const availableLeaves = Math.max(0, 12 - approvedLeaves);

    // 2. Get all leave requests with test results
    const leaves = await Leave.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get test results for these leaves
    const leaveIds = leaves.map(leave => leave._id);
    const testResults = await TestResult.find({ leaveId: { $in: leaveIds } }).lean();

    // Map test results to leaves
    const leavesWithTests = leaves.map(leave => {
      const testResult = testResults.find(test => test.leaveId.toString() === leave._id.toString());
      return {
        ...leave,
        testResult: testResult || null
      };
    });

    // 3. Get test statistics
    const allTestResults = await TestResult.find({ 
      leaveId: { $in: await Leave.find({ studentId }).distinct('_id') }
    });

    const totalTests = allTestResults.length;
    const completedTests = allTestResults.filter(test => test.result).length;
    const pendingTests = testingLeaves;
    const passedTests = allTestResults.filter(test => test.result === 'pass').length;

    // Calculate average score
    let totalScore = 0;
    allTestResults.forEach(test => {
      totalScore += test.finalScore || 0;
    });
    const averageScore = totalTests > 0 ? Math.round(totalScore / totalTests) : 0;

    // 4. Get latest test scores (last 5)
    const latestTests = allTestResults
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(test => ({
        id: test._id,
        leaveId: test.leaveId,
        type: 'mcq', // For now, assuming MCQ tests
        testName: 'Technical Knowledge Test',
        score: test.finalScore || 0,
        grade: test.grade || 'N/A',
        date: test.createdAt,
        duration: test.totalTime || 'N/A',
        result: test.result
      }));

    // 5. Response
    res.status(200).json({
      success: true,
      message: 'Student dashboard data fetched successfully',
      data: {
        student: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role
        },
        leaveStatus: {
          totalLeaves,
          approvedLeaves,
          pendingLeaves,
          rejectedLeaves,
          testingLeaves,
          availableLeaves
        },
        testProgress: {
          totalTests,
          completedTests,
          pendingTests,
          passedTests,
          averageScore
        },
        latestScores: latestTests,
        recentLeaves: leavesWithTests.slice(0, 5)
      }
    });

  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student dashboard data',
      error: error.message
    });
  }
};

// @desc    Get student leave history with filters
// @route   GET /api/student/leaves
// @access  Private (Student)
const getLeaveHistory = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { studentId };
    if (status) {
      query.status = status;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get leaves
    const leaves = await Leave.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get test results for these leaves
    const leaveIds = leaves.map(leave => leave._id);
    const testResults = await TestResult.find({ leaveId: { $in: leaveIds } }).lean();

    // Map test results to leaves
    const leavesWithTests = leaves.map(leave => {
      const testResult = testResults.find(test => test.leaveId.toString() === leave._id.toString());
      return {
        ...leave,
        testResult: testResult || null,
        canTakeTest: leave.status === 'testing' && !testResult
      };
    });

    // Get total count
    const total = await Leave.countDocuments(query);

    res.status(200).json({
      success: true,
      count: leaves.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: leavesWithTests
    });

  } catch (error) {
    console.error('Get leave history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching leave history',
      error: error.message
    });
  }
};

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private (Student)
const getStudentProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select('-password');
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get statistics
    const totalLeaves = await Leave.countDocuments({ studentId: student._id });
    const approvedLeaves = await Leave.countDocuments({ studentId: student._id, status: 'approved' });
    
    const allTests = await TestResult.find({ 
      leaveId: { $in: await Leave.find({ studentId: student._id }).distinct('_id') }
    });
    
    const totalTests = allTests.length;
    const passedTests = allTests.filter(test => test.result === 'pass').length;

    res.status(200).json({
      success: true,
      data: {
        profile: student,
        stats: {
          totalLeaves,
          approvedLeaves,
          totalTests,
          passedTests,
          availableLeaves: Math.max(0, 12 - approvedLeaves)
        }
      }
    });

  } catch (error) {
    console.error('Get student profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching student profile',
      error: error.message
    });
  }
};

module.exports = {
  getStudentDashboard,
  getLeaveHistory,
  getStudentProfile
};
