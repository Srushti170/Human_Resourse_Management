import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee reference is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    }
  },
  
  checkInTime: {
    type: Date,
    validate: {
      validator: function(value) {
        if (!value) return true;
        const dateOnly = new Date(this.date);
        dateOnly.setHours(0, 0, 0, 0);
        const checkInDateOnly = new Date(value);
        checkInDateOnly.setHours(0, 0, 0, 0);
        return checkInDateOnly.getTime() === dateOnly.getTime();
      },
      message: 'Check-in time must be on the same date as attendance date'
    }
  },
  checkOutTime: {
    type: Date,
    validate: {
      validator: function(value) {
        if (!value || !this.checkInTime) return true;
        return value > this.checkInTime;
      },
      message: 'Check-out time must be after check-in time'
    }
  },
  
  status: {
    type: String,
    enum: {
      values: ['Present', 'Absent', 'Half-day', 'Leave'],
      message: '{VALUE} is not a valid status'
    },
    required: [true, 'Status is required'],
    default: 'Absent'
  },
  
  workingHours: {
    type: Number,
    default: 0,
    min: [0, 'Working hours cannot be negative'],
    max: [24, 'Working hours cannot exceed 24']
  },
  
  remarks: {
    type: String,
    trim: true,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  
  // Optional: Location tracking
  checkInLocation: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  
  checkOutLocation: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  
  // For admin modifications
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
}, {
  timestamps: true
});

// Compound unique index: one attendance record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Index for faster queries
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ status: 1 });

// Pre-save middleware to calculate working hours
attendanceSchema.pre('save', function(next) {
  if (this.checkInTime && this.checkOutTime) {
    const diffMs = this.checkOutTime - this.checkInTime;
    this.workingHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimals
    
    // Auto-set status based on working hours (if not manually set)
    if (this.isNew && this.status === 'Absent') {
      if (this.workingHours >= 8) {
        this.status = 'Present';
      } else if (this.workingHours >= 4) {
        this.status = 'Half-day';
      }
    }
  }
  next();
});

// Static method to get attendance for date range
attendanceSchema.statics.getAttendanceForRange = async function(employeeId, startDate, endDate) {
  return await this.find({
    employee: employeeId,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

// Static method to get attendance statistics
attendanceSchema.statics.getAttendanceStats = async function(employeeId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const stats = await this.aggregate([
    {
      $match: {
        employee: mongoose.Types.ObjectId(employeeId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalHours: { $sum: '$workingHours' }
      }
    }
  ]);
  
  return stats;
};

// Method to check if already checked in today
attendanceSchema.methods.isCheckedIn = function() {
  return this.checkInTime && !this.checkOutTime;
};

export default mongoose.model('Attendance', attendanceSchema);
