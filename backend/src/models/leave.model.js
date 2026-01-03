import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee reference is required']
  },
  
  leaveType: {
    type: String,
    enum: {
      values: ['Paid', 'Sick', 'Unpaid', 'Casual', 'Maternity', 'Paternity'],
      message: '{VALUE} is not a valid leave type'
    },
    required: [true, 'Leave type is required']
  },
  
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    validate: {
      validator: function(value) {
        // Start date should not be in the past (for new requests)
        if (this.isNew) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return value >= today;
        }
        return true;
      },
      message: 'Start date cannot be in the past'
    }
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value >= this.startDate;
      },
      message: 'End date must be after or equal to start date'
    }
  },
  
  numberOfDays: {
    type: Number,
    required: true,
    min: [0.5, 'Minimum leave duration is 0.5 days']
  },
  
  reason: {
    type: String,
    required: [true, 'Reason for leave is required'],
    trim: true,
    minlength: [10, 'Reason must be at least 10 characters'],
    maxlength: [500, 'Reason cannot exceed 500 characters']
  },
  remarks: {
    type: String,
    trim: true,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  
  status: {
    type: String,
    enum: {
      values: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Pending',
    required: true
  },
  
  // Approval Details
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  approverComments: {
    type: String,
    trim: true,
    maxlength: [500, 'Approver comments cannot exceed 500 characters']
  },
  
  // Attachment (optional: medical certificate, etc.)
  attachments: [{
    fileName: String,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
}, {
  timestamps: true
});

// Indexes for better query performance
leaveSchema.index({ employee: 1, startDate: -1 });
leaveSchema.index({ status: 1 });
leaveSchema.index({ leaveType: 1 });

// Pre-save middleware to calculate number of days
leaveSchema.pre('save', function(next) {
  if (this.startDate && this.endDate) {
    const diffTime = Math.abs(this.endDate - this.startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end date
    this.numberOfDays = diffDays;
  }
  next();
});

// Pre-save middleware to set approval timestamp
leaveSchema.pre('save', function(next) {
  if (this.isModified('status') && (this.status === 'Approved' || this.status === 'Rejected')) {
    if (!this.approvedAt) {
      this.approvedAt = Date.now();
    }
  }
  next();
});

// Static method to check for overlapping leaves
leaveSchema.statics.checkOverlap = async function(employeeId, startDate, endDate, excludeLeaveId = null) {
  const query = {
    employee: employeeId,
    status: { $in: ['Pending', 'Approved'] },
    $or: [
      {
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
      }
    ]
  };
  
  if (excludeLeaveId) {
    query._id = { $ne: excludeLeaveId };
  }
  
  const overlappingLeaves = await this.find(query);
  return overlappingLeaves.length > 0;
};

// Static method to get leave history
leaveSchema.statics.getLeaveHistory = async function(employeeId, year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  return await this.find({
    employee: employeeId,
    startDate: { $gte: startDate, $lte: endDate }
  })
  .sort({ startDate: -1 })
  .populate('approvedBy', 'firstName lastName');
};

// Static method to get leave statistics by type
leaveSchema.statics.getLeaveStatsByType = async function(employeeId, year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  const stats = await this.aggregate([
    {
      $match: {
        employee: mongoose.Types.ObjectId(employeeId),
        startDate: { $gte: startDate, $lte: endDate },
        status: 'Approved'
      }
    },
    {
      $group: {
        _id: '$leaveType',
        totalDays: { $sum: '$numberOfDays' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  return stats;
};

// Method to check if leave can be cancelled
leaveSchema.methods.canBeCancelled = function() {
  return this.status === 'Pending' || (this.status === 'Approved' && this.startDate > new Date());
};

// Method to check if leave can be edited
leaveSchema.methods.canBeEdited = function() {
  return this.status === 'Pending';
};

export default mongoose.model('Leave', leaveSchema);
