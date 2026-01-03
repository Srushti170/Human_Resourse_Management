import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  
  action: {
    type: String,
    required: [true, 'Action is required'],
    trim: true,
    enum: [
      // Authentication
      'LOGIN',
      'LOGOUT',
      'PASSWORD_RESET',
      'EMAIL_VERIFICATION',
      
      // Profile
      'PROFILE_UPDATED',
      'PROFILE_PICTURE_UPDATED',
      
      // Attendance
      'CHECK_IN',
      'CHECK_OUT',
      'ATTENDANCE_UPDATED',
      'ATTENDANCE_VIEWED',
      
      // Leave
      'LEAVE_APPLIED',
      'LEAVE_APPROVED',
      'LEAVE_REJECTED',
      'LEAVE_CANCELLED',
      'LEAVE_UPDATED',
      
      // Payroll
      'PAYROLL_VIEWED',
      'PAYROLL_UPDATED',
      'PAYROLL_GENERATED',
      'SALARY_SLIP_DOWNLOADED',
      
      // Document
      'DOCUMENT_UPLOADED',
      'DOCUMENT_DOWNLOADED',
      'DOCUMENT_DELETED',
      'DOCUMENT_VERIFIED',
      
      // User Management
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'USER_ACTIVATED',
      'USER_DEACTIVATED',
      
      // System
      'SETTINGS_UPDATED',
      'REPORT_GENERATED',
      'DATA_EXPORTED',
      
      // Other
      'OTHER'
    ]
  },
  
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  // Request Information
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  
  // Device Information
  device: {
    type: {
      type: String,
      enum: ['Desktop', 'Mobile', 'Tablet', 'Other']
    },
    os: String,
    browser: String
  },
  
  // Related Resource
  resourceType: {
    type: String,
    enum: ['User', 'Attendance', 'Leave', 'Payroll', 'Document', 'Notification', 'Other']
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId
  },
  
  // Status
  status: {
    type: String,
    enum: ['Success', 'Failed', 'Pending'],
    default: 'Success'
  },
  
  // Error Information (if failed)
  errorMessage: {
    type: String,
    trim: true
  },
  
  // Changes Made (for update actions)
  changes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Additional Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  
  // Severity Level
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Low'
  },
  
}, {
  timestamps: true
});

// Indexes for better query performance
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ resourceType: 1, resourceId: 1 });
activityLogSchema.index({ status: 1 });
activityLogSchema.index({ severity: 1 });
activityLogSchema.index({ createdAt: -1 });

// TTL index to auto-delete logs older than 1 year (optional)
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

// Static method to create log entry
activityLogSchema.statics.log = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error creating activity log:', error);
    // Don't throw error to prevent logging from breaking the main flow
    return null;
  }
};

// Static method to get user activity logs
activityLogSchema.statics.getUserLogs = async function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.action) {
    query.action = options.action;
  }
  
  if (options.startDate && options.endDate) {
    query.createdAt = {
      $gte: options.startDate,
      $lte: options.endDate
    };
  }
  
  const limit = options.limit || 50;
  const skip = options.skip || 0;
  
  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

// Static method to get recent activity
activityLogSchema.statics.getRecentActivity = async function(limit = 20, filters = {}) {
  const query = {};
  
  if (filters.user) {
    query.user = filters.user;
  }
  
  if (filters.action) {
    query.action = filters.action;
  }
  
  if (filters.resourceType) {
    query.resourceType = filters.resourceType;
  }
  
  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('user', 'firstName lastName email employeeId profilePicture')
    .lean();
};

// Static method to get activity statistics
activityLogSchema.statics.getActivityStats = async function(startDate, endDate) {
  const stats = await this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }
    },
    {
      $group: {
        _id: '$action',
        count: { $sum: 1 },
        successCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Success'] }, 1, 0] }
        },
        failedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'Failed'] }, 1, 0] }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  return stats;
};

// Static method to get login history
activityLogSchema.statics.getLoginHistory = async function(userId, limit = 10) {
  return await this.find({
    user: userId,
    action: 'LOGIN'
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .select('createdAt ipAddress userAgent device status')
  .lean();
};

// Static method to detect suspicious activity
activityLogSchema.statics.detectSuspiciousActivity = async function(userId, timeWindowMinutes = 60) {
  const timeWindow = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
  
  const failedAttempts = await this.countDocuments({
    user: userId,
    action: { $in: ['LOGIN', 'PASSWORD_RESET'] },
    status: 'Failed',
    createdAt: { $gte: timeWindow }
  });
  
  const multipleIPs = await this.distinct('ipAddress', {
    user: userId,
    createdAt: { $gte: timeWindow }
  });
  
  return {
    failedAttempts,
    suspiciousIPCount: multipleIPs.length > 3 ? multipleIPs.length : 0,
    isSuspicious: failedAttempts > 5 || multipleIPs.length > 3
  };
};

// Static method to get audit trail for a resource
activityLogSchema.statics.getAuditTrail = async function(resourceType, resourceId) {
  return await this.find({
    resourceType,
    resourceId
  })
  .sort({ createdAt: -1 })
  .populate('user', 'firstName lastName email employeeId')
  .lean();
};

// Static method to delete old logs
activityLogSchema.statics.deleteOldLogs = async function(daysOld = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    severity: { $nin: ['High', 'Critical'] } // Keep important logs
  });
  
  return result.deletedCount;
};

// Virtual for formatted timestamp
activityLogSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
});

// Virtual for action display name
activityLogSchema.virtual('actionDisplayName').get(function() {
  return this.action.replace(/_/g, ' ').toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
});

activityLogSchema.set('toJSON', { virtuals: true });
activityLogSchema.set('toObject', { virtuals: true });

export default mongoose.model('ActivityLog', activityLogSchema);
