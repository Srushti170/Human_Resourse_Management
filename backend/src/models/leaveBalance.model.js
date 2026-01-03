import mongoose from 'mongoose';

const leaveBalanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee reference is required']
  },
  
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [2020, 'Year must be 2020 or later'],
    max: [2100, 'Year must be before 2100'],
    default: () => new Date().getFullYear()
  },
  
  // Paid Leave
  paidLeave: {
    total: {
      type: Number,
      default: 12,
      min: [0, 'Total paid leave cannot be negative']
    },
    used: {
      type: Number,
      default: 0,
      min: [0, 'Used paid leave cannot be negative']
    },
    remaining: {
      type: Number,
      default: function() {
        return this.paidLeave.total - this.paidLeave.used;
      },
      min: [0, 'Remaining paid leave cannot be negative']
    }
  },
  
  // Sick Leave
  sickLeave: {
    total: {
      type: Number,
      default: 7,
      min: [0, 'Total sick leave cannot be negative']
    },
    used: {
      type: Number,
      default: 0,
      min: [0, 'Used sick leave cannot be negative']
    },
    remaining: {
      type: Number,
      default: function() {
        return this.sickLeave.total - this.sickLeave.used;
      },
      min: [0, 'Remaining sick leave cannot be negative']
    }
  },
  
  // Casual Leave
  casualLeave: {
    total: {
      type: Number,
      default: 10,
      min: [0, 'Total casual leave cannot be negative']
    },
    used: {
      type: Number,
      default: 0,
      min: [0, 'Used casual leave cannot be negative']
    },
    remaining: {
      type: Number,
      default: function() {
        return this.casualLeave.total - this.casualLeave.used;
      },
      min: [0, 'Remaining casual leave cannot be negative']
    }
  },
  
  // Maternity Leave (if applicable)
  maternityLeave: {
    total: {
      type: Number,
      default: 0,
      min: [0, 'Total maternity leave cannot be negative']
    },
    used: {
      type: Number,
      default: 0,
      min: [0, 'Used maternity leave cannot be negative']
    },
    remaining: {
      type: Number,
      default: function() {
        return this.maternityLeave.total - this.maternityLeave.used;
      },
      min: [0, 'Remaining maternity leave cannot be negative']
    }
  },
  
  // Paternity Leave (if applicable)
  paternityLeave: {
    total: {
      type: Number,
      default: 0,
      min: [0, 'Total paternity leave cannot be negative']
    },
    used: {
      type: Number,
      default: 0,
      min: [0, 'Used paternity leave cannot be negative']
    },
    remaining: {
      type: Number,
      default: function() {
        return this.paternityLeave.total - this.paternityLeave.used;
      },
      min: [0, 'Remaining paternity leave cannot be negative']
    }
  },
  
  // Carry Forward from previous year
  carryForward: {
    type: Number,
    default: 0,
    min: [0, 'Carry forward cannot be negative'],
    max: [15, 'Maximum carry forward is 15 days']
  },
  
  // Leave History Summary
  totalLeaveTaken: {
    type: Number,
    default: 0,
    min: [0, 'Total leave taken cannot be negative']
  },
  
  // Last Updated
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
}, {
  timestamps: true
});

// Compound unique index: one leave balance per employee per year
leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });

// Pre-save middleware to calculate remaining leaves
leaveBalanceSchema.pre('save', function(next) {
  // Calculate remaining for each leave type
  this.paidLeave.remaining = Math.max(0, this.paidLeave.total - this.paidLeave.used);
  this.sickLeave.remaining = Math.max(0, this.sickLeave.total - this.sickLeave.used);
  this.casualLeave.remaining = Math.max(0, this.casualLeave.total - this.casualLeave.used);
  this.maternityLeave.remaining = Math.max(0, this.maternityLeave.total - this.maternityLeave.used);
  this.paternityLeave.remaining = Math.max(0, this.paternityLeave.total - this.paternityLeave.used);
  
  // Calculate total leave taken
  this.totalLeaveTaken = 
    this.paidLeave.used + 
    this.sickLeave.used + 
    this.casualLeave.used + 
    this.maternityLeave.used + 
    this.paternityLeave.used;
  
  this.lastUpdated = Date.now();
  
  next();
});

// Static method to initialize leave balance for new employee
leaveBalanceSchema.statics.initializeForEmployee = async function(employeeId, customQuotas = {}) {
  const currentYear = new Date().getFullYear();
  
  const leaveBalance = new this({
    employee: employeeId,
    year: currentYear,
    paidLeave: {
      total: customQuotas.paidLeave || 12,
      used: 0
    },
    sickLeave: {
      total: customQuotas.sickLeave || 7,
      used: 0
    },
    casualLeave: {
      total: customQuotas.casualLeave || 10,
      used: 0
    }
  });
  
  return await leaveBalance.save();
};

// Static method to get leave balance for employee
leaveBalanceSchema.statics.getBalanceForEmployee = async function(employeeId, year) {
  const queryYear = year || new Date().getFullYear();
  
  let balance = await this.findOne({
    employee: employeeId,
    year: queryYear
  });
  
  // If not found, initialize one
  if (!balance) {
    balance = await this.initializeForEmployee(employeeId);
  }
  
  return balance;
};

// Static method to reset balances for new year
leaveBalanceSchema.statics.resetForNewYear = async function(year) {
  const previousYear = year - 1;
  
  // Get all balances from previous year
  const previousBalances = await this.find({ year: previousYear });
  
  const newBalances = [];
  
  for (const prevBalance of previousBalances) {
    // Calculate carry forward (max 15 days of unused paid leave)
    const carryForward = Math.min(prevBalance.paidLeave.remaining, 15);
    
    const newBalance = new this({
      employee: prevBalance.employee,
      year: year,
      paidLeave: {
        total: prevBalance.paidLeave.total + carryForward,
        used: 0
      },
      sickLeave: {
        total: prevBalance.sickLeave.total,
        used: 0
      },
      casualLeave: {
        total: prevBalance.casualLeave.total,
        used: 0
      },
      carryForward: carryForward
    });
    
    newBalances.push(newBalance);
  }
  
  return await this.insertMany(newBalances);
};

// Method to deduct leave
leaveBalanceSchema.methods.deductLeave = async function(leaveType, days) {
  const typeMap = {
    'Paid': 'paidLeave',
    'Sick': 'sickLeave',
    'Casual': 'casualLeave',
    'Maternity': 'maternityLeave',
    'Paternity': 'paternityLeave'
  };
  
  const field = typeMap[leaveType];
  
  if (!field || !this[field]) {
    throw new Error(`Invalid leave type: ${leaveType}`);
  }
  
  if (this[field].remaining < days) {
    throw new Error(`Insufficient ${leaveType.toLowerCase()} leave balance`);
  }
  
  this[field].used += days;
  return await this.save();
};

// Method to restore leave (when leave is cancelled/rejected)
leaveBalanceSchema.methods.restoreLeave = async function(leaveType, days) {
  const typeMap = {
    'Paid': 'paidLeave',
    'Sick': 'sickLeave',
    'Casual': 'casualLeave',
    'Maternity': 'maternityLeave',
    'Paternity': 'paternityLeave'
  };
  
  const field = typeMap[leaveType];
  
  if (!field || !this[field]) {
    throw new Error(`Invalid leave type: ${leaveType}`);
  }
  
  this[field].used = Math.max(0, this[field].used - days);
  return await this.save();
};

// Method to check if sufficient leave balance exists
leaveBalanceSchema.methods.hasSufficientBalance = function(leaveType, days) {
  const typeMap = {
    'Paid': 'paidLeave',
    'Sick': 'sickLeave',
    'Casual': 'casualLeave',
    'Maternity': 'maternityLeave',
    'Paternity': 'paternityLeave',
    'Unpaid': null // Unpaid leave has no balance check
  };
  
  const field = typeMap[leaveType];
  
  if (!field) return true; // Unpaid leave
  if (!this[field]) return false;
  
  return this[field].remaining >= days;
};

// Virtual for total available leaves
leaveBalanceSchema.virtual('totalAvailable').get(function() {
  return (
    this.paidLeave.remaining +
    this.sickLeave.remaining +
    this.casualLeave.remaining +
    this.maternityLeave.remaining +
    this.paternityLeave.remaining
  );
});

// Virtual for total allocated leaves
leaveBalanceSchema.virtual('totalAllocated').get(function() {
  return (
    this.paidLeave.total +
    this.sickLeave.total +
    this.casualLeave.total +
    this.maternityLeave.total +
    this.paternityLeave.total
  );
});

leaveBalanceSchema.set('toJSON', { virtuals: true });
leaveBalanceSchema.set('toObject', { virtuals: true });

export default mongoose.model('LeaveBalance', leaveBalanceSchema);
