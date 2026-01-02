const express = require('express');
const router = express.Router();
const { 
  generateMCQ,
  startMCQTest, 
  submitMCQ, 
  getTestResult, 
  evaluateMCQPreview,
  generateCoding,
  submitCoding
} = require('../controllers/testController');
const { protect, studentOnly } = require('../middleware/auth');

// MCQ Routes
// @route   GET /api/test/mcq/generate
// @desc    Generate MCQ test
// @access  Private (Student)
router.get('/mcq/generate', protect, studentOnly, generateMCQ);

// @route   POST /api/test/mcq/start
// @desc    Start MCQ test session
// @access  Private (Student)
router.post('/mcq/start', protect, studentOnly, startMCQTest);

// @route   POST /api/test/mcq/submit
// @desc    Submit MCQ test
// @access  Private (Student)
router.post('/mcq/submit', protect, studentOnly, submitMCQ);

// @route   POST /api/test/mcq/evaluate
// @desc    Evaluate MCQ answers (preview without saving)
// @access  Private (Student)
router.post('/mcq/evaluate', protect, studentOnly, evaluateMCQPreview);

// Coding Routes
// @route   GET /api/test/coding/generate
// @desc    Generate coding test
// @access  Private (Student)
router.get('/coding/generate', protect, studentOnly, generateCoding);

// @route   POST /api/test/coding/submit
// @desc    Submit coding test
// @access  Private (Student)
router.post('/coding/submit', protect, studentOnly, submitCoding);

// Results Route
// @route   GET /api/test/results/:leaveId
// @desc    Get test result by leave ID
// @access  Private
router.get('/results/:leaveId', protect, getTestResult);

module.exports = router;
