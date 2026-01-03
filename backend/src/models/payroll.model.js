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
      hra: { type: Number, default: 0, min: 0 },
      transport: { type: Number, default: 0, min: 0 },
      medical: { type: Number, default: 0, min: 0 },
      bonus: { type: Number, default: 0, min: 0 },
      others: { type: Number, default: 0, min: 0 },
    },

    deductions: {
      tax: { type: Number, default: 0, min: 0 },
      providentFund: { type: Number, default: 0, min: 0 },
      insurance: { type: Number, default: 0, min: 0 },
      professionalTax: { type: Number, default: 0, min: 0 },
      loanDeduction: { type: Number, default: 0, min: 0 },
      others: { type: Number, default: 0, min: 0 },
    },

    grossSalary: { type: Number, min: 0 },
    netSalary: { type: Number, min: 0 },

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
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ["Bank Transfer", "Cheque", "Cash", "Other"],
      default: "Bank Transfer",
    },

    transactionId: { type: String, trim: true },

    bankAccount: {
      accountNumber: String,
      accountHolderName: String,
      bankName: String,
      ifscCode: String,
      branch: String,
    },

    workingDays: { type: Number, min: 0, max: 31 },
    totalDays: { type: Number, min: 0, max: 31 },

    paidLeaveDays: { type: Number, default: 0, min: 0 },
    unpaidLeaveDays: { type: Number, default: 0, min: 0 },

    notes: { type: String, trim: true, maxlength: 1000 },

    salarySlipUrl: String,

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    processedAt: Date,

    // soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

//
// UNIQUE: one payroll per employee per month
//
payrollSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });


//
// AUTO-CALCULATE SALARY (no next callback)
//
payrollSchema.pre("save", function () {
  const allowances = this.allowances || {};
  const deductions = this.deductions || {};

  const totalAllowances = Object.values(allowances).reduce(
    (sum, v) => sum + (v || 0),
    0
  );

  const totalDeductions = Object.values(deductions).reduce(
    (sum, v) => sum + (v || 0),
    0
  );

  this.grossSalary = (this.baseSalary || 0) + totalAllowances;

  let net = this.grossSalary - totalDeductions;

  // unpaid leave penalty
  if (this.totalDays && this.unpaidLeaveDays) {
    const perDay = this.grossSalary / this.totalDays;
    net -= perDay * this.unpaidLeaveDays;
  }

  this.netSalary = Math.max(0, net);

  // stamp payment time
  if (this.paymentStatus === "Paid" && !this.processedAt) {
    this.processedAt = new Date();
    if (!this.paymentDate) this.paymentDate = new Date();
  }
});


//
// INSTANCE METHODS
//
payrollSchema.methods.getTotalAllowances = function () {
  return Object.values(this.allowances || {}).reduce(
    (s, v) => s + (v || 0),
    0
  );
};

payrollSchema.methods.getTotalDeductions = function () {
  return Object.values(this.deductions || {}).reduce(
    (s, v) => s + (v || 0),
    0
  );
};

payrollSchema.methods.canBeModified = function () {
  return ["Pending", "On Hold"].includes(this.paymentStatus);
};


//
// VIRTUALS
//
payrollSchema.virtual("monthName").get(function () {
  return [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ][this.month - 1];
});


//
// YEARLY SUMMARY
//
payrollSchema.statics.getYearlySummary = async function (employeeId, year) {
  const result = await this.aggregate([
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
        monthsPaid: { $sum: 1 },
      },
    },
  ]);

  return (
    result[0] || { totalGross: 0, totalNet: 0, monthsPaid: 0 }
  );
};

export default mongoose.model("Payroll", payrollSchema);
