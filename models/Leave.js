const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required']
    },
    fromDate: {
      type: Date,
      required: [true, 'From date is required'],
      validate: {
        validator: function (value) {
          return value >= new Date(new Date().setHours(0, 0, 0, 0));
        },
        message: 'From date cannot be in the past'
      }
    },
    toDate: {
      type: Date,
      required: [true, 'To date is required'],
      validate: {
        validator: function (value) {
          return value >= this.fromDate;
        },
        message: 'To date must be after from date'
      }
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      trim: true,
      minlength: [10, 'Reason must be at least 10 characters long'],
      maxlength: [500, 'Reason cannot exceed 500 characters']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'testing', 'approved', 'rejected'],
        message: '{VALUE} is not a valid status'
      },
      default: 'pending'
    },
    adminComment: {
      type: String,
      trim: true,
      maxlength: [300, 'Admin comment cannot exceed 300 characters']
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    }
  },
  {
    timestamps: true // Adds createdAt and updatedAt fields automatically
  }
);

// Virtual field to calculate leave duration in days
leaveSchema.virtual('duration').get(function () {
  const diffTime = Math.abs(this.toDate - this.fromDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  return diffDays;
});

// Index for faster queries
leaveSchema.index({ studentId: 1, status: 1 });
leaveSchema.index({ status: 1, createdAt: -1 });

// Populate student details automatically on find queries
leaveSchema.pre(/^find/, async function () {
  this.populate({
    path: 'studentId',
    select: 'name email role'
  }).populate({
    path: 'approvedBy',
    select: 'name email'
  });
});

const Leave = mongoose.model('Leave', leaveSchema);

module.exports = Leave;
