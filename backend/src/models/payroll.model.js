import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    baseSalary: {
      type: Number,
      required: true,
      min: 0,
    },

    allowances: {
      type: {
        hra: { type: Number, default: 0, min: 0 },
        transport: { type: Number, default: 0, min: 0 },
        medical: { type: Number, default: 0, min: 0 },
        bonus: { type: Number, default: 0, min: 0 },
        others: { type: Number, default: 0, min: 0 },
      },
      default: {},
    },

    deductions: {
      type: {
        tax: { type: Number, default: 0, min: 0 },
        providentFund: { type: Number, default: 0, min: 0 },
        insurance: { type: Number, default: 0, min: 0 },
        professionalTax: { type: Number, default: 0, min: 0 },
        loanDeduction: { type: Number, default: 0, min: 0 },
        others: { type: Number, default: 0, min: 0 },
      },
      default: {},
    },

    grossSalary: {
      type: Number,
      min: 0,
    },

    netSalary: {
      type: Number,
      min: 0,
    },

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
      min: 2020,
      max: 2100,
    },

    paymentDate: Date,

    paymentStatus: {
      type: String,
      enum: ["Pending", "Processing", "Paid", "Failed", "On Hold"],
      default: "Pending",
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["Bank Transfer", "Cheque", "Cash", "Other"],
      default: "Bank Transfer",
    },

    transactionId: {
      type: String,
      trim: true,
    },

    bankAccount: {
      accountNumber: { type: String, trim: true },
      accountHolderName: { type: String, trim: true },
      bankName: { type: String, trim: true },
      ifscCode: { type: String, trim: true, uppercase: true },
      branch: { type: String, trim: true },
    },

    workingDays: {
      type: Number,
      min: 0,
      max: 31,
    },

    totalDays: {
      type: Number,
      min: 0,
      max: 31,
    },

    paidLeaveDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    unpaidLeaveDays: {
      type: Number,
      default: 0,
      min: 0,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    salarySlipUrl: String,

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    processedAt: Date,
  },
  { timestamps: true }
);

//
// Unique payroll per employee per month-year
//
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });

//
// Auto-calc salary before save
//
payrollSchema.pre("save", function (next) {
  const allowances = this.allowances || {};
  const deductions = this.deductions || {};

  const totalAllowances = Object.values(allowances).reduce((s, v) => s + (v || 0), 0);
  const totalDeductions = Object.values(deductions).reduce((s, v) => s + (v || 0), 0);

  this.grossSalary = (this.baseSalary || 0) + totalAllowances;

  let net = this.grossSalary - totalDeductions;

  if (this.totalDays && this.unpaidLeaveDays) {
    const perDay = this.grossSalary / this.totalDays;
    net -= perDay * this.unpaidLeaveDays;
  }

  this.netSalary = Math.max(0, net);

  if (
    this.isModified("paymentStatus") &&
    this.paymentStatus === "Paid" &&
    !this.processedAt
  ) {
    this.processedAt = new Date();
    if (!this.paymentDate) this.paymentDate = new Date();
  }

  next();
});

//
// Instance helpers
//
payrollSchema.methods.getTotalAllowances = function () {
  return Object.values(this.allowances || {}).reduce((s, v) => s + (v || 0), 0);
};

payrollSchema.methods.getTotalDeductions = function () {
  return Object.values(this.deductions || {}).reduce((s, v) => s + (v || 0), 0);
};

payrollSchema.methods.canBeModified = function () {
  return ["Pending", "On Hold"].includes(this.paymentStatus);
};

//
// Virtual month name
//
payrollSchema.virtual("monthName").get(function () {
  return [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ][this.month - 1];
});

//
// Safe yearly summary (fixed aggregation bug)
//
payrollSchema.statics.getYearlySummary = async function (employeeId, year) {
  const summary = await this.aggregate([
    {
      $match: {
        employee: new mongoose.Types.ObjectId(employeeId),
        year,
        paymentStatus: "Paid",
      },
    },
    {
      $group: {
        _id: null,
        totalGross: { $sum: "$grossSalary" },
        totalNet: { $sum: "$netSalary" },
        totalDeductions: { $sum: "$deductions.tax" },
        monthsPaid: { $sum: 1 },
      },
    },
  ]);

  return summary[0] || {
    totalGross: 0,
    totalNet: 0,
    totalDeductions: 0,
    monthsPaid: 0,
  };
};

export default mongoose.model("Payroll", payrollSchema);
