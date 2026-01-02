const TestResult = require('../models/TestResult');
const Leave = require('../models/Leave');

// Constants for scoring
const PASS_THRESHOLD = 50; // Minimum score to pass (50%)
const MCQ_WEIGHT = 0.4; // MCQ contributes 40% to final score
const CODING_WEIGHT = 0.6; // Coding contributes 60% to final score

// Helper function to calculate final score and determine pass/fail
const calculateFinalScore = (mcqScore = 0, codingScore = 0) => {
  // Calculate weighted final score
  const finalScore = Math.round((mcqScore * MCQ_WEIGHT) + (codingScore * CODING_WEIGHT));
  
  // Determine pass/fail based on threshold
  const result = finalScore >= PASS_THRESHOLD ? 'pass' : 'fail';
  
  // Determine grade
  let grade;
  if (finalScore >= 90) grade = 'A+';
  else if (finalScore >= 80) grade = 'A';
  else if (finalScore >= 70) grade = 'B';
  else if (finalScore >= 60) grade = 'C';
  else if (finalScore >= 50) grade = 'D';
  else grade = 'F';

  return {
    finalScore,
    result,
    grade,
    passed: result === 'pass'
  };
};

// Helper function to evaluate MCQ answers
const evaluateMCQ = (submittedAnswers, questionBank) => {
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let unanswered = 0;
  const detailedResults = [];

  submittedAnswers.forEach((answer) => {
    const questionIndex = answer.id - 1;
    
    if (questionIndex >= 0 && questionIndex < questionBank.length) {
      const question = questionBank[questionIndex];
      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      
      if (answer.selectedAnswer === null || answer.selectedAnswer === undefined) {
        unanswered++;
      } else if (isCorrect) {
        correctAnswers++;
      } else {
        wrongAnswers++;
      }

      detailedResults.push({
        questionId: answer.id,
        question: question.question,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation
      });
    }
  });

  const totalQuestions = submittedAnswers.length;
  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const percentage = score;

  // Determine grade based on score with detailed feedback
  let grade, gradeMessage, performance;
  if (score >= 90) {
    grade = 'A+';
    gradeMessage = 'Outstanding! Excellent technical knowledge!';
    performance = 'Exceptional';
  } else if (score >= 80) {
    grade = 'A';
    gradeMessage = 'Excellent work! Strong understanding of concepts.';
    performance = 'Excellent';
  } else if (score >= 70) {
    grade = 'B';
    gradeMessage = 'Good job! Solid grasp of fundamentals.';
    performance = 'Good';
  } else if (score >= 60) {
    grade = 'C';
    gradeMessage = 'Fair performance. Room for improvement.';
    performance = 'Average';
  } else if (score >= 50) {
    grade = 'D';
    gradeMessage = 'Needs improvement. Consider reviewing concepts.';
    performance = 'Below Average';
  } else {
    grade = 'F';
    gradeMessage = 'Requires significant improvement. Please study more.';
    performance = 'Needs Work';
  }

  return {
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    unanswered,
    score,
    percentage,
    grade,
    gradeMessage,
    performance,
    detailedResults,
    summary: {
      correct: `${correctAnswers}/${totalQuestions} (${Math.round((correctAnswers/totalQuestions)*100)}%)`,
      wrong: `${wrongAnswers}/${totalQuestions}`,
      unanswered: `${unanswered}/${totalQuestions}`,
      accuracy: `${Math.round((correctAnswers/(correctAnswers+wrongAnswers))*100)}%`
    }
  };
};

// Comprehensive MCQ Question Bank - 25 Hard Technical Questions
const mcqQuestionBank = {
  javascript: {
    hard: [
      {
        question: "What is the output of: console.log([] + [] + 'foo'.split(''))?",
        options: ["foo", "f,o,o", "['f','o','o']", "error"],
        correctAnswer: 1,
        explanation: "[] + [] results in empty string, then adding array ['f','o','o'] converts it to string 'f,o,o'."
      },
      {
        question: "What is the event loop in JavaScript?",
        options: ["A loop that runs events", "A mechanism that handles asynchronous operations", "A function that creates events", "A method to prevent memory leaks"],
        correctAnswer: 1,
        explanation: "The event loop is a mechanism that handles asynchronous callbacks by managing the call stack and callback queue."
      },
      {
        question: "What is the difference between call(), apply(), and bind()?",
        options: ["They are the same", "call/apply invoke immediately, bind returns new function", "Only bind works with objects", "call is deprecated"],
        correctAnswer: 1,
        explanation: "call() and apply() invoke the function immediately with different argument syntax, while bind() returns a new function with bound 'this'."
      },
      {
        question: "What is a WeakMap in JavaScript?",
        options: ["A slow Map", "A Map with weak object references allowing garbage collection", "A Map without methods", "An encrypted Map"],
        correctAnswer: 1,
        explanation: "WeakMap holds weak references to objects, allowing them to be garbage collected if no other references exist."
      },
      {
        question: "What is the output of: typeof typeof 1?",
        options: ["number", "string", "undefined", "object"],
        correctAnswer: 1,
        explanation: "typeof 1 returns 'number', then typeof 'number' returns 'string' since typeof always returns a string."
      }
    ]
  },
  react: {
    hard: [
      {
        question: "What is the purpose of React.memo()?",
        options: ["Store data", "Prevent unnecessary re-renders of functional components", "Manage memory", "Create memoized functions"],
        correctAnswer: 1,
        explanation: "React.memo() is a higher-order component that prevents re-renders if props haven't changed, similar to PureComponent."
      },
      {
        question: "What is the difference between useEffect and useLayoutEffect?",
        options: ["No difference", "useLayoutEffect runs synchronously after DOM mutations", "useEffect is faster", "useLayoutEffect is deprecated"],
        correctAnswer: 1,
        explanation: "useLayoutEffect fires synchronously after DOM mutations but before browser paint, useful for DOM measurements."
      },
      {
        question: "What is prop drilling and how can you avoid it?",
        options: ["Drilling holes in components", "Passing props through many levels; use Context or state management", "A debugging technique", "A performance optimization"],
        correctAnswer: 1,
        explanation: "Prop drilling is passing props through intermediate components. Solutions include Context API, Redux, or component composition."
      },
      {
        question: "What is the purpose of the key prop in React lists?",
        options: ["For styling", "Help React identify which items changed for efficient re-rendering", "For encryption", "Required by law"],
        correctAnswer: 1,
        explanation: "Keys help React identify which items have changed, been added, or removed, enabling efficient updates to the DOM."
      },
      {
        question: "What is React Fiber?",
        options: ["A library", "React's new reconciliation algorithm for incremental rendering", "A framework", "A styling solution"],
        correctAnswer: 1,
        explanation: "React Fiber is the reimplementation of React's core algorithm, enabling incremental rendering and better priority handling."
      }
    ]
  },
  nodejs: {
    hard: [
      {
        question: "What is the difference between process.nextTick() and setImmediate()?",
        options: ["They are the same", "nextTick executes before I/O, setImmediate after", "setImmediate is faster", "nextTick is deprecated"],
        correctAnswer: 1,
        explanation: "process.nextTick() callbacks execute before any I/O operations, while setImmediate() callbacks execute after I/O events."
      },
      {
        question: "What is the purpose of the cluster module in Node.js?",
        options: ["Group data", "Enable multi-core processing by spawning child processes", "Manage databases", "Handle file operations"],
        correctAnswer: 1,
        explanation: "The cluster module allows Node.js to spawn multiple child processes sharing the same server port, utilizing multi-core systems."
      },
      {
        question: "What is event emitter pattern in Node.js?",
        options: ["A bug", "A pattern where objects emit named events that trigger registered listeners", "A security feature", "A deprecated pattern"],
        correctAnswer: 1,
        explanation: "Event Emitter is a pattern where objects emit named events, allowing other code to listen and respond to these events."
      },
      {
        question: "What is middleware in Express.js?",
        options: ["A database", "Functions that have access to req, res, and next() in the request-response cycle", "A server", "A framework"],
        correctAnswer: 1,
        explanation: "Middleware functions have access to request, response objects and next() function, executing during the request-response cycle."
      },
      {
        question: "What is the purpose of streams in Node.js?",
        options: ["Watch videos", "Handle reading/writing data piece by piece for memory efficiency", "Store data", "Compress files"],
        correctAnswer: 1,
        explanation: "Streams allow processing data piece by piece without loading everything into memory, essential for large files."
      }
    ]
  },
  database: {
    hard: [
      {
        question: "What is database normalization?",
        options: ["Making data normal", "Organizing data to reduce redundancy and dependency", "Encrypting data", "Backing up data"],
        correctAnswer: 1,
        explanation: "Normalization is the process of organizing database tables to reduce data redundancy and improve data integrity."
      },
      {
        question: "What is the difference between INNER JOIN and LEFT JOIN?",
        options: ["No difference", "INNER returns matching rows, LEFT returns all left table rows", "INNER is faster", "LEFT is deprecated"],
        correctAnswer: 1,
        explanation: "INNER JOIN returns only matching rows from both tables, while LEFT JOIN returns all rows from left table with matching right table rows."
      },
      {
        question: "What is an index in a database?",
        options: ["A table", "A data structure that improves query speed at cost of write performance", "A backup", "A key"],
        correctAnswer: 1,
        explanation: "An index is a data structure that improves the speed of data retrieval but requires additional storage and slows down writes."
      },
      {
        question: "What is ACID in databases?",
        options: ["A chemical", "Atomicity, Consistency, Isolation, Durability", "A query language", "A backup method"],
        correctAnswer: 1,
        explanation: "ACID stands for Atomicity, Consistency, Isolation, Durability - properties that guarantee database transaction reliability."
      },
      {
        question: "What is the difference between SQL and NoSQL databases?",
        options: ["No difference", "SQL is relational with schema, NoSQL is flexible/schemaless", "SQL is newer", "NoSQL is slower"],
        correctAnswer: 1,
        explanation: "SQL databases are relational with fixed schemas, while NoSQL databases offer flexible, schema-less data models for unstructured data."
      }
    ]
  },
  advanced: {
    hard: [
      {
        question: "What is the difference between HTTP and HTTPS?",
        options: ["No difference", "HTTPS uses SSL/TLS encryption for secure communication", "HTTP is faster", "HTTPS is deprecated"],
        correctAnswer: 1,
        explanation: "HTTPS (HTTP Secure) uses SSL/TLS protocols to encrypt data transmission, providing security for sensitive information."
      },
      {
        question: "What is REST API?",
        options: ["A database", "Architectural style using HTTP methods for stateless client-server communication", "A server", "A programming language"],
        correctAnswer: 1,
        explanation: "REST (Representational State Transfer) is an architectural style using standard HTTP methods for stateless communication."
      },
      {
        question: "What is JWT (JSON Web Token)?",
        options: ["A database", "A compact, URL-safe token for securely transmitting information", "A framework", "A programming language"],
        correctAnswer: 1,
        explanation: "JWT is a compact, URL-safe token that encodes claims to be transferred between parties, commonly used for authentication."
      },
      {
        question: "What is the difference between authentication and authorization?",
        options: ["Same thing", "Authentication verifies identity, authorization verifies permissions", "Authentication is newer", "Authorization is optional"],
        correctAnswer: 1,
        explanation: "Authentication verifies who you are (identity), while authorization determines what you can access (permissions)."
      },
      {
        question: "What is a microservices architecture?",
        options: ["Small services", "Architectural style where app is collection of loosely coupled services", "A framework", "A database design"],
        correctAnswer: 1,
        explanation: "Microservices architecture structures an application as a collection of loosely coupled, independently deployable services."
      }
    ]
  }
};

// @desc    Generate MCQ test (Auto generates 25 hard technical questions)
// @route   GET /api/test/mcq/generate
// @access  Private (Student)
const generateMCQ = async (req, res) => {
  try {
    // Default: Generate 25 mixed hard questions from all categories
    const { count = 25 } = req.query;
    
    const questionCount = parseInt(count);
    if (isNaN(questionCount) || questionCount < 1 || questionCount > 50) {
      return res.status(400).json({
        success: false,
        message: 'Count must be between 1 and 50'
      });
    }

    // Collect all hard questions from all topics
    const allHardQuestions = [];
    const topics = Object.keys(mcqQuestionBank);
    
    topics.forEach((topic) => {
      const hardQuestions = mcqQuestionBank[topic].hard || [];
      hardQuestions.forEach((q) => {
        allHardQuestions.push({
          ...q,
          topic: topic.charAt(0).toUpperCase() + topic.slice(1) // Capitalize topic name
        });
      });
    });

    if (allHardQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No hard questions available'
      });
    }

    // Shuffle and select questions
    const shuffledQuestions = [...allHardQuestions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffledQuestions.slice(0, Math.min(questionCount, allHardQuestions.length));

    // Format questions (remove correct answer and explanation from response)
    const formattedQuestions = selectedQuestions.map((q, index) => ({
      id: index + 1,
      question: q.question,
      options: q.options,
      topic: q.topic
    }));

    res.status(200).json({
      success: true,
      message: `Generated ${formattedQuestions.length} hard technical questions for testing your knowledge`,
      data: {
        difficulty: 'HARD',
        totalQuestions: formattedQuestions.length,
        timeLimit: formattedQuestions.length * 90, // 1.5 minutes per question in seconds
        questions: formattedQuestions,
        instructions: [
          'This test contains challenging technical questions',
          'Each question has only ONE correct answer',
          'You have 1.5 minutes per question',
          'Your score will be calculated automatically',
          'Grade: A+ (90%+), A (80%+), B (70%+), C (60%+), D (50%+), F (<50%)'
        ]
      },
      // Store answer key separately (for internal use)
      _answerKey: selectedQuestions.map((q, index) => ({
        id: index + 1,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      }))
    });

  } catch (error) {
    console.error('Generate MCQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating MCQ test',
      error: error.message
    });
  }
};

// @desc    Start MCQ test (creates test session)
// @route   POST /api/test/mcq/start
// @access  Private (Student)
const startMCQTest = async (req, res) => {
  try {
    const { leaveId } = req.body;

    // Validation
    if (!leaveId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide leaveId'
      });
    }

    // Check if leave exists and belongs to student
    const leave = await Leave.findById(leaveId);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    if (leave.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start test for this leave'
      });
    }

    // Check if leave status is 'testing'
    if (leave.status !== 'testing') {
      return res.status(400).json({
        success: false,
        message: `Leave status must be 'testing' to start test. Current status: ${leave.status}`
      });
    }

    // Check if test already started/exists
    const existingResult = await TestResult.findOne({ leaveId });
    if (existingResult) {
      return res.status(400).json({
        success: false,
        message: 'Test has already been started for this leave',
        data: existingResult
      });
    }

    res.status(200).json({
      success: true,
      message: 'MCQ test session started. You can now generate and submit test.',
      data: {
        leaveId: leave._id,
        studentId: leave.studentId._id,
        startTime: new Date(),
        status: 'Test session active'
      }
    });

  } catch (error) {
    console.error('Start MCQ test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting MCQ test',
      error: error.message
    });
  }
};

// @desc    Submit MCQ test
// @route   POST /api/test/mcq/submit
// @access  Private (Student)
const submitMCQ = async (req, res) => {
  try {
    const { leaveId, answers, topic, difficulty, timeTaken } = req.body;

    // Validation
    if (!leaveId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide leaveId and answers array'
      });
    }

    // Check if leave exists and belongs to student
    const leave = await Leave.findById(leaveId);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    if (leave.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit test for this leave'
      });
    }

    // Check if test result already exists
    const existingResult = await TestResult.findOne({ leaveId });
    if (existingResult) {
      return res.status(400).json({
        success: false,
        message: 'Test has already been submitted for this leave'
      });
    }

    // Get answer key
    const selectedTopic = topic || 'general';
    const selectedDifficulty = difficulty || 'medium';
    const questionBank = mcqQuestionBank[selectedTopic]?.[selectedDifficulty] || [];

    // Evaluate MCQ answers
    const evaluation = evaluateMCQ(answers, questionBank);

    // Get or create test result
    let testResult = await TestResult.findOne({ leaveId });
    
    if (testResult) {
      // Update existing result with MCQ score
      testResult.mcqScore = evaluation.score;
      testResult.mcqDetails = {
        totalQuestions: evaluation.totalQuestions,
        correctAnswers: evaluation.correctAnswers,
        wrongAnswers: evaluation.wrongAnswers,
        timeTaken: timeTaken || 0
      };
      await testResult.save();
    } else {
      // Create new test result (MCQ only, coding will be 0)
      testResult = await TestResult.create({
        leaveId,
        mcqScore: evaluation.score,
        codingScore: 0,
        mcqDetails: {
          totalQuestions: evaluation.totalQuestions,
          correctAnswers: evaluation.correctAnswers,
          wrongAnswers: evaluation.wrongAnswers,
          timeTaken: timeTaken || 0
        }
      });
    }

    // Calculate final score (MCQ 40% + Coding 60%)
    const finalScoreData = calculateFinalScore(testResult.mcqScore, testResult.codingScore);

    res.status(201).json({
      success: true,
      message: `MCQ test submitted successfully! Grade: ${evaluation.grade} - ${evaluation.gradeMessage}`,
      data: testResult,
      evaluation: {
        totalQuestions: evaluation.totalQuestions,
        correctAnswers: evaluation.correctAnswers,
        wrongAnswers: evaluation.wrongAnswers,
        unanswered: evaluation.unanswered,
        mcqScore: evaluation.score,
        mcqPercentage: evaluation.percentage,
        mcqGrade: evaluation.grade,
        gradeMessage: evaluation.gradeMessage,
        performance: evaluation.performance,
        summary: evaluation.summary,
        detailedResults: evaluation.detailedResults
      },
      finalScore: {
        ...finalScoreData,
        message: `Overall Score: ${finalScoreData.finalScore}% (MCQ: ${testResult.mcqScore}%, Coding: ${testResult.codingScore}%)`,
        note: 'Final score = (MCQ × 40%) + (Coding × 60%)',
        gradeBreakdown: {
          'A+ (90-100%)': 'Outstanding - Exceptional technical knowledge',
          'A (80-89%)': 'Excellent - Strong understanding of concepts',
          'B (70-79%)': 'Good - Solid grasp of fundamentals',
          'C (60-69%)': 'Average - Fair performance',
          'D (50-59%)': 'Below Average - Needs improvement',
          'F (0-49%)': 'Failing - Requires significant study'
        }
      }
    });

  } catch (error) {
    console.error('Submit MCQ error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting MCQ test',
      error: error.message
    });
  }
};

// @desc    Get test results for a leave
// @route   GET /api/test/results/:leaveId
// @access  Private (Student)
const getTestResult = async (req, res) => {
  try {
    const { leaveId } = req.params;

    // Find test result
    const testResult = await TestResult.findOne({ leaveId }).populate({
      path: 'leaveId',
      select: 'studentId fromDate toDate reason status',
      populate: {
        path: 'studentId',
        select: 'name email'
      }
    });

    if (!testResult) {
      return res.status(404).json({
        success: false,
        message: 'Test result not found'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && 
        testResult.leaveId.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this test result'
      });
    }

    // Calculate additional metrics
    const totalQuestions = testResult.mcqDetails.totalQuestions + 
                          testResult.codingDetails.totalProblems;
    const totalCorrect = testResult.mcqDetails.correctAnswers + 
                        testResult.codingDetails.solvedProblems;
    const totalTime = testResult.mcqDetails.timeTaken + 
                     testResult.codingDetails.timeTaken;

    res.status(200).json({
      success: true,
      data: {
        ...testResult.toObject(),
        summary: {
          totalQuestions,
          totalCorrect,
          totalTime,
          passStatus: testResult.result === 'pass' ? 'Passed' : 'Failed'
        }
      }
    });

  } catch (error) {
    console.error('Get test result error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching test result',
      error: error.message
    });
  }
};

// @desc    Evaluate MCQ answers (preview without saving)
// @route   POST /api/test/mcq/evaluate
// @access  Private (Student)
const evaluateMCQPreview = async (req, res) => {
  try {
    const { answers, topic, difficulty } = req.body;

    // Validation
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide answers array'
      });
    }

    // Get answer key
    const selectedTopic = topic || 'general';
    const selectedDifficulty = difficulty || 'medium';
    const questionBank = mcqQuestionBank[selectedTopic]?.[selectedDifficulty] || [];

    if (questionBank.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question bank not found for specified topic and difficulty'
      });
    }

    // Evaluate answers
    const evaluation = evaluateMCQ(answers, questionBank);

    res.status(200).json({
      success: true,
      message: 'MCQ evaluation completed',
      evaluation: {
        totalQuestions: evaluation.totalQuestions,
        correctAnswers: evaluation.correctAnswers,
        wrongAnswers: evaluation.wrongAnswers,
        unanswered: evaluation.unanswered,
        score: evaluation.score,
        percentage: evaluation.percentage,
        grade: evaluation.grade,
        passed: evaluation.score >= 50,
        detailedResults: evaluation.detailedResults
      }
    });

  } catch (error) {
    console.error('Evaluate MCQ preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error evaluating MCQ',
      error: error.message
    });
  }
};

// Helper function to evaluate coding answers
const evaluateCoding = (submittedCode, problemDetails) => {
  const { language, requiredKeywords = [], testCases = [], maxScore = 100 } = problemDetails;
  
  let score = 0;
  let feedback = [];
  let syntaxValid = false;
  let keywordsFound = [];
  let keywordsMissing = [];
  let logicScore = 0;

  // 1. Syntax Check (30 points)
  const syntaxCheck = checkSyntax(submittedCode, language);
  if (syntaxCheck.isValid) {
    score += 30;
    syntaxValid = true;
    feedback.push('✓ Syntax is correct');
  } else {
    feedback.push(`✗ Syntax error: ${syntaxCheck.error}`);
  }

  // 2. Required Keywords Check (30 points)
  if (requiredKeywords.length > 0) {
    const keywordCheck = checkRequiredKeywords(submittedCode, requiredKeywords);
    keywordsFound = keywordCheck.found;
    keywordsMissing = keywordCheck.missing;
    
    const keywordScore = (keywordsFound.length / requiredKeywords.length) * 30;
    score += Math.round(keywordScore);
    
    if (keywordsFound.length === requiredKeywords.length) {
      feedback.push('✓ All required keywords present');
    } else {
      feedback.push(`✗ Missing keywords: ${keywordsMissing.join(', ')}`);
    }
  } else {
    // If no keywords specified, give full points
    score += 30;
  }

  // 3. Basic Logic Check (40 points)
  const logicCheck = checkBasicLogic(submittedCode, language, testCases);
  logicScore = logicCheck.score;
  score += logicCheck.score;
  feedback = feedback.concat(logicCheck.feedback);

  // Cap score at maxScore
  score = Math.min(score, maxScore);

  return {
    score,
    syntaxValid,
    keywordsFound,
    keywordsMissing,
    logicScore,
    feedback,
    details: {
      syntaxPoints: syntaxValid ? 30 : 0,
      keywordPoints: Math.round((keywordsFound.length / (requiredKeywords.length || 1)) * 30),
      logicPoints: logicScore
    }
  };
};

// Check syntax based on language
const checkSyntax = (code, language) => {
  if (!code || code.trim() === '') {
    return { isValid: false, error: 'Code is empty' };
  }

  try {
    switch (language.toLowerCase()) {
      case 'javascript':
        return checkJavaScriptSyntax(code);
      
      case 'python':
        return checkPythonSyntax(code);
      
      default:
        return { isValid: true, error: null }; // Skip syntax check for unsupported languages
    }
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};

// Check JavaScript syntax
const checkJavaScriptSyntax = (code) => {
  try {
    // Basic syntax checks
    const openBraces = (code.match(/{/g) || []).length;
    const closeBraces = (code.match(/}/g) || []).length;
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;

    if (openBraces !== closeBraces) {
      return { isValid: false, error: 'Unmatched curly braces' };
    }
    if (openParens !== closeParens) {
      return { isValid: false, error: 'Unmatched parentheses' };
    }
    if (openBrackets !== closeBrackets) {
      return { isValid: false, error: 'Unmatched square brackets' };
    }

    // Check for basic JavaScript patterns
    const hasFunction = /function\s+\w+|const\s+\w+\s*=|let\s+\w+\s*=|var\s+\w+\s*=/.test(code);
    if (!hasFunction && code.length > 50) {
      return { isValid: true, error: 'No function declarations found (warning)' };
    }

    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};

// Check Python syntax
const checkPythonSyntax = (code) => {
  try {
    // Basic indentation check
    const lines = code.split('\n');
    let indentLevel = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '') continue;

      const leadingSpaces = line.search(/\S/);
      if (leadingSpaces % 4 !== 0 && leadingSpaces > 0) {
        return { isValid: false, error: `Incorrect indentation on line ${i + 1}` };
      }

      // Check for colon and indentation
      if (line.trim().endsWith(':')) {
        indentLevel++;
      }
    }

    // Check for basic Python patterns
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;

    if (openParens !== closeParens) {
      return { isValid: false, error: 'Unmatched parentheses' };
    }
    if (openBrackets !== closeBrackets) {
      return { isValid: false, error: 'Unmatched square brackets' };
    }

    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};

// Check for required keywords
const checkRequiredKeywords = (code, requiredKeywords) => {
  const found = [];
  const missing = [];

  requiredKeywords.forEach(keyword => {
    // Create regex that matches whole words
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(code)) {
      found.push(keyword);
    } else {
      missing.push(keyword);
    }
  });

  return { found, missing };
};

// Check basic logic
const checkBasicLogic = (code, language, testCases = []) => {
  let score = 0;
  const feedback = [];

  // Logic checks based on code structure (40 points total)
  
  // 1. Check for control structures (15 points)
  const hasIfStatement = /if\s*\(|if\s+/.test(code);
  const hasLoop = /for\s*\(|while\s*\(|for\s+\w+\s+in/.test(code);
  const hasFunction = /function\s+\w+|def\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{/.test(code);

  if (hasIfStatement) {
    score += 5;
    feedback.push('✓ Contains conditional logic');
  }
  if (hasLoop) {
    score += 5;
    feedback.push('✓ Contains loop structure');
  }
  if (hasFunction) {
    score += 5;
    feedback.push('✓ Contains function definition');
  }

  // 2. Check for return statement (10 points)
  const hasReturn = /return\s+/.test(code);
  if (hasReturn) {
    score += 10;
    feedback.push('✓ Contains return statement');
  } else {
    feedback.push('✗ Missing return statement');
  }

  // 3. Check code length and complexity (15 points)
  const lines = code.split('\n').filter(line => line.trim() !== '');
  if (lines.length >= 5) {
    score += 15;
    feedback.push('✓ Adequate code length');
  } else if (lines.length >= 3) {
    score += 10;
    feedback.push('⚠ Code is quite short');
  } else {
    feedback.push('✗ Code is too short');
  }

  // Cap at 40 points for logic
  score = Math.min(score, 40);

  return { score, feedback };
};

// @desc    Generate coding test
// @route   GET /api/test/coding/generate
// @access  Private (Student)
const generateCoding = async (req, res) => {
  try {
    const { language = 'javascript', difficulty = 'medium', count = 3 } = req.query;

    // Sample coding problems
    const codingProblems = {
      javascript: {
        easy: [
          {
            id: 1,
            title: 'Sum of Two Numbers',
            description: 'Write a function that takes two numbers as parameters and returns their sum.',
            requiredKeywords: ['function', 'return'],
            language: 'javascript',
            difficulty: 'easy',
            timeLimit: 600, // 10 minutes
            expectedOutput: 'A function that adds two numbers'
          },
          {
            id: 2,
            title: 'Check Even or Odd',
            description: 'Write a function that checks if a number is even or odd.',
            requiredKeywords: ['function', 'if', 'return'],
            language: 'javascript',
            difficulty: 'easy',
            timeLimit: 600
          }
        ],
        medium: [
          {
            id: 1,
            title: 'Array Reversal',
            description: 'Write a function that reverses an array without using the built-in reverse() method.',
            requiredKeywords: ['function', 'for', 'return'],
            language: 'javascript',
            difficulty: 'medium',
            timeLimit: 900, // 15 minutes
          },
          {
            id: 2,
            title: 'Find Maximum in Array',
            description: 'Write a function to find the maximum number in an array.',
            requiredKeywords: ['function', 'for', 'return'],
            language: 'javascript',
            difficulty: 'medium',
            timeLimit: 900
          }
        ]
      },
      python: {
        easy: [
          {
            id: 1,
            title: 'Sum of Two Numbers',
            description: 'Write a function that takes two numbers as parameters and returns their sum.',
            requiredKeywords: ['def', 'return'],
            language: 'python',
            difficulty: 'easy',
            timeLimit: 600
          }
        ],
        medium: [
          {
            id: 1,
            title: 'List Reversal',
            description: 'Write a function that reverses a list without using the built-in reverse() method.',
            requiredKeywords: ['def', 'for', 'return'],
            language: 'python',
            difficulty: 'medium',
            timeLimit: 900
          }
        ]
      }
    };

    // Get problems
    const problems = codingProblems[language]?.[difficulty] || [];
    
    if (problems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No coding problems available for this language and difficulty'
      });
    }

    const selectedProblems = problems.slice(0, Math.min(parseInt(count), problems.length));

    res.status(200).json({
      success: true,
      message: 'Coding test generated successfully',
      data: {
        language,
        difficulty,
        totalProblems: selectedProblems.length,
        totalTimeLimit: selectedProblems.reduce((sum, p) => sum + p.timeLimit, 0),
        problems: selectedProblems.map(({ id, title, description, language, difficulty, timeLimit }) => ({
          id,
          title,
          description,
          language,
          difficulty,
          timeLimit
        }))
      }
    });

  } catch (error) {
    console.error('Generate coding test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating coding test',
      error: error.message
    });
  }
};

// @desc    Submit coding test
// @route   POST /api/test/coding/submit
// @access  Private (Student)
const submitCoding = async (req, res) => {
  try {
    const { leaveId, solutions, language = 'javascript', timeTaken } = req.body;

    // Validation
    if (!leaveId || !solutions || !Array.isArray(solutions)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide leaveId and solutions array'
      });
    }

    // Check if leave exists
    const leave = await Leave.findById(leaveId);
    
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave application not found'
      });
    }

    if (leave.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit test for this leave'
      });
    }

    // Get existing test result or create new
    let testResult = await TestResult.findOne({ leaveId });
    
    // Evaluate coding solutions
    let totalScore = 0;
    let solvedProblems = 0;
    const evaluations = [];

    solutions.forEach((solution, index) => {
      const problemDetails = {
        language,
        requiredKeywords: solution.requiredKeywords || [],
        testCases: solution.testCases || []
      };

      const evaluation = evaluateCoding(solution.code, problemDetails);
      totalScore += evaluation.score;
      
      if (evaluation.score >= 50) {
        solvedProblems++;
      }

      evaluations.push({
        problemId: solution.id || index + 1,
        ...evaluation
      });
    });

    const codingScore = Math.round(totalScore / solutions.length);

    if (testResult) {
      // Update existing result
      testResult.codingScore = codingScore;
      testResult.codingDetails = {
        totalProblems: solutions.length,
        solvedProblems,
        timeTaken: timeTaken || 0
      };
      await testResult.save();
    } else {
      // Create new result
      testResult = await TestResult.create({
        leaveId,
        mcqScore: 0,
        codingScore,
        codingDetails: {
          totalProblems: solutions.length,
          solvedProblems,
          timeTaken: timeTaken || 0
        }
      });
    }

    // Calculate final score (MCQ 40% + Coding 60%)
    const finalScoreData = calculateFinalScore(testResult.mcqScore, testResult.codingScore);

    res.status(201).json({
      success: true,
      message: 'Coding test submitted successfully',
      data: testResult,
      evaluations,
      summary: {
        totalProblems: solutions.length,
        solvedProblems,
        codingScore,
        averageScore: Math.round(totalScore / solutions.length)
      },
      finalScore: {
        ...finalScoreData,
        message: `Overall Score: ${finalScoreData.finalScore}% (MCQ: ${testResult.mcqScore}%, Coding: ${testResult.codingScore}%)`,
        note: 'Final score = (MCQ × 40%) + (Coding × 60%)',
        threshold: `Pass threshold: ${PASS_THRESHOLD}%`
      }
    });

  } catch (error) {
    console.error('Submit coding test error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting coding test',
      error: error.message
    });
  }
};

module.exports = {
  generateMCQ,
  startMCQTest,
  submitMCQ,
  getTestResult,
  evaluateMCQPreview,
  generateCoding,
  submitCoding
};
