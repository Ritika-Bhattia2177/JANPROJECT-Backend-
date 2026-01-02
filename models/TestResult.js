const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema(
  {
    leaveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Leave',
      required: [true, 'Leave ID is required'],
      unique: true // One test result per leave application
    },
    mcqScore: {
      type: Number,
      required: [true, 'MCQ score is required'],
      min: [0, 'MCQ score cannot be negative'],
      max: [100, 'MCQ score cannot exceed 100'],
      default: 0
    },
    codingScore: {
      type: Number,
      required: [true, 'Coding score is required'],
      min: [0, 'Coding score cannot be negative'],
      max: [100, 'Coding score cannot exceed 100'],
      default: 0
    },
    finalScore: {
      type: Number,
      min: [0, 'Final score cannot be negative'],
      max: [100, 'Final score cannot exceed 100']
    },
    result: {
      type: String,
      enum: {
        values: ['pass', 'fail'],
        message: '{VALUE} is not a valid result'
      },
      required: [true, 'Result is required']
    },
    mcqDetails: {
      totalQuestions: {
        type: Number,
        default: 0
      },
      correctAnswers: {
        type: Number,
        default: 0
      },
      wrongAnswers: {
        type: Number,
        default: 0
      },
      timeTaken: {
        type: Number, // in seconds
        default: 0
      }
    },
    codingDetails: {
      totalProblems: {
        type: Number,
        default: 0
      },
      solvedProblems: {
        type: Number,
        default: 0
      },
      timeTaken: {
        type: Number, // in seconds
        default: 0
      }
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [500, 'Remarks cannot exceed 500 characters']
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt fields automatically
  }
);

// Calculate final score before saving (weighted average: MCQ 40%, Coding 60%)
testResultSchema.pre('save', function (next) {
  if (this.isModified('mcqScore') || this.isModified('codingScore')) {
    this.finalScore = Math.round((this.mcqScore * 0.4) + (this.codingScore * 0.6));
    
    // Determine pass/fail based on final score (pass threshold: 50)
    this.result = this.finalScore >= 50 ? 'pass' : 'fail';
  }
  next();
});

// Index for faster queries
testResultSchema.index({ leaveId: 1 });
testResultSchema.index({ result: 1, createdAt: -1 });

// Populate leave details automatically on find queries
testResultSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'leaveId',
    select: 'studentId fromDate toDate reason status',
    populate: {
      path: 'studentId',
      select: 'name email'
    }
  });
  next();
});

// Virtual field to calculate pass percentage
testResultSchema.virtual('passPercentage').get(function () {
  return this.finalScore;
});

const TestResult = mongoose.model('TestResult', testResultSchema);

module.exports = TestResult;
