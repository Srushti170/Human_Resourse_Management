import mongoose from 'mongoose';

const payrollSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee reference is required']
  },
  
  // Salary Structure
  baseSalary: {
    type: Number,
    required: [true, 'Base salary is required'],
    min: [0, 'Base salary cannot be negative']
  },
  
  allowances: {
    hra: {
      type: Number,
      default: 0,
      min: [0, 'HRA cannot be negative']
    },
    transport: {
      type: Number,
      default: 0,
      min: [0, 'Transport allowance cannot be negative']
    },
    medical: {
      type: Number,
      default: 0,
      min: [0, 'Medical allowance cannot be negative']
    },
    bonus: {
      type: Number,
      default: 0,
      min: [0, 'Bonus cannot be negative']
    },
    others: {
      type: Number,
      default: 0,
      min: [0, 'Other allowances cannot be negative']
    }
  },
  
  deductions: {
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative']
    },
    providentFund: {
      type: Number,
      default: 0,
      min: [0, 'Provident Fund cannot be negative']
    },
    insurance: {
      type: Number,
      default: 0,
      min: [0, 'Insurance cannot be negative']
    },
    professionalTax: {
      type: Number,
      default: 0,
      min: [0, 'Professional tax cannot be negative']
    },
    loanDeduction: {
      type: Number,
      default: 0,
      min: [0, 'Loan deduction cannot be negative']
    },
    others: {
      type: Number,
      default: 0,
      min: [0, 'Other deductions cannot be negative']
    }
  },
  
  grossSalary: {
    type: Number,
    required: true,
    min: [0, 'Gross salary cannot be negative']
  },
  netSalary: {
    type: Number,
    required: true,
    min: [0, 'Net salary cannot be negative']
  },
  
  // Pay Period
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2020, 'Year must be 2020 or later'],
    max: [2100, 'Year must be before 2100']
  },
  
  // Payment Details
  paymentDate: {
    type: Date
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['Pending', 'Processing', 'Paid', 'Failed', 'On Hold'],
      message: '{VALUE} is not a valid payment status'
    },
    default: 'Pending',
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'Cheque', 'Cash', 'Other'],
    default: 'Bank Transfer'
  },
  transactionId: {
    type: String,
    trim: true
  },
  
  // Bank Details
  bankAccount: {
    accountNumber: {
      type: String,
      trim: true
    },
    accountHolderName: {
      type: String,
      trim: true
    },
    bankName: {
      type: String,
      trim: true
    },
    ifscCode: {
      type: String,
      trim: true,
      uppercase: true
    },
    branch: {
      type: String,
      trim: true
    }
  },
  
  // Working Days
  workingDays: {
    type: Number,
    min: [0, 'Working days cannot be negative'],
    max: [31, 'Working days cannot exceed 31']
  },
  totalDays: {
    type: Number,
    min: [0, 'Total days cannot be negative'],
    max: [31, 'Total days cannot exceed 31']
  },
  
  // Leave Adjustments
  paidLeaveDays: {
    type: Number,
    default: 0,
    min: [0, 'Paid leave days cannot be negative']
  },
  unpaidLeaveDays: {
    type: Number,
    default: 0,
    min: [0, 'Unpaid leave days cannot be negative']
  },
  
  // Additional Info
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Salary Slip
  salarySlipUrl: {
    type: String
  },
  
  // Processing
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: {
    type: Date
  },
  
}, {
  timestamps: true
});

// Compound unique index: one payroll per employee per month-year
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

// Indexes for better query performance
payrollSchema.index({ paymentStatus: 1 });
payrollSchema.index({ paymentDate: -1 });

// Pre-save middleware to calculate gross and net salary
payrollSchema.pre('save', function(next) {
  // Calculate gross salary
  const totalAllowances = Object.values(this.allowances).reduce((sum, val) => sum + (val || 0), 0);
  this.grossSalary = this.baseSalary + totalAllowances;
  
  // Calculate net salary
  const totalDeductions = Object.values(this.deductions).reduce((sum, val) => sum + (val || 0), 0);
  this.netSalary = this.grossSalary - totalDeductions;
  
  // Adjust for unpaid leave days
  if (this.totalDays && this.unpaidLeaveDays) {
    const perDaySalary = this.grossSalary / this.totalDays;
    const leaveDeduction = perDaySalary * this.unpaidLeaveDays;
    this.netSalary -= leaveDeduction;
  }
  
  // Set processed timestamp if status is changing to Paid
  if (this.isModified('paymentStatus') && this.paymentStatus === 'Paid' && !this.processedAt) {
    this.processedAt = Date.now();
    if (!this.paymentDate) {
      this.paymentDate = Date.now();
    }
  }
  
  next();
});

// Static method to get payroll summary for a year
payrollSchema.statics.getYearlySummary = async function(employeeId, year) {
  const summary = await this.aggregate([
    {
      $match: {
        employee: mongoose.Types.ObjectId(employeeId),
        year: year,
        paymentStatus: 'Paid'
      }
    },
    {
      $group: {
        _id: null,
        totalGross: { $sum: '$grossSalary' },
        totalNet: { $sum: '$netSalary' },
        totalDeductions: { $sum: { $sum: Object.values(this.deductions || {}) } },
        monthsPaid: { $sum: 1 }
      }
    }
  ]);
  
  return summary[0] || {
    totalGross: 0,
    totalNet: 0,
    totalDeductions: 0,
    monthsPaid: 0
  };
};

// Static method to get pending payrolls
payrollSchema.statics.getPendingPayrolls = async function(month, year) {
  return await this.find({
    month: month,
    year: year,
    paymentStatus: { $in: ['Pending', 'Processing'] }
  })
  .populate('employee', 'firstName lastName employeeId email')
  .sort({ createdAt: -1 });
};

// Method to calculate total allowances
payrollSchema.methods.getTotalAllowances = function() {
  return Object.values(this.allowances).reduce((sum, val) => sum + (val || 0), 0);
};

// Method to calculate total deductions
payrollSchema.methods.getTotalDeductions = function() {
  return Object.values(this.deductions).reduce((sum, val) => sum + (val || 0), 0);
};

// Method to check if payroll can be modified
payrollSchema.methods.canBeModified = function() {
  return this.paymentStatus === 'Pending' || this.paymentStatus === 'On Hold';
};

// Virtual for month name
payrollSchema.virtual('monthName').get(function() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  return months[this.month - 1];
});

payrollSchema.set('toJSON', { virtuals: true });
payrollSchema.set('toObject', { virtuals: true });

export default mongoose.model('Payroll', payrollSchema);
