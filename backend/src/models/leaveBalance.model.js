import mongoose from "mongoose";

const leaveSchema = {
  total: { type: Number, default: 0, min: 0 },
  used: { type: Number, default: 0, min: 0 },
  remaining: { type: Number, default: 0, min: 0 },
};

const leaveBalanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    year: {
      type: Number,
      required: true,
      min: 2020,
      max: 2100,
      default: () => new Date().getFullYear(),
    },

    paidLeave: { type: leaveSchema, default: {} },
    sickLeave: { type: leaveSchema, default: {} },
    casualLeave: { type: leaveSchema, default: {} },
    maternityLeave: { type: leaveSchema, default: {} },
    paternityLeave: { type: leaveSchema, default: {} },

    carryForward: {
      type: Number,
      default: 0,
      min: 0,
      max: 15,
    },

    totalLeaveTaken: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// unique employee-year record
leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });

//
// Helper: recompute leaves
//
function recompute(doc) {
  const types = [
    "paidLeave",
    "sickLeave",
    "casualLeave",
    "maternityLeave",
    "paternityLeave",
  ];

  doc.totalLeaveTaken = 0;

  types.forEach((t) => {
    const node = doc[t] || {};

    node.total = Number(node.total || 0);
    node.used = Number(node.used || 0);
    node.remaining = Math.max(0, node.total - node.used);

    doc[t] = node;
    doc.totalLeaveTaken += node.used;
  });

  doc.lastUpdated = new Date();
}

//
// Pre-save: auto calculate remaining + totals
//
leaveBalanceSchema.pre("save", function (next) {
  recompute(this);
  next();
});

//
// Static: initialize for employee
//
leaveBalanceSchema.statics.initializeForEmployee = async function (
  employeeId,
  custom = {}
) {
  return await this.create({
    employee: new mongoose.Types.ObjectId(employeeId),
    year: new Date().getFullYear(),
    paidLeave: { total: custom.paidLeave ?? 12 },
    sickLeave: { total: custom.sickLeave ?? 7 },
    casualLeave: { total: custom.casualLeave ?? 10 },
  });
};

//
// Static: get or create balance
//
leaveBalanceSchema.statics.getBalanceForEmployee = async function (
  employeeId,
  year = new Date().getFullYear()
) {
  let record = await this.findOne({
    employee: new mongoose.Types.ObjectId(employeeId),
    year,
  });

  if (!record) record = await this.initializeForEmployee(employeeId);

  return record;
};

//
// Static: reset for new year with carry forward
//
leaveBalanceSchema.statics.resetForNewYear = async function (year) {
  const prevYear = year - 1;

  const prev = await this.find({ year: prevYear });

  const docs = prev.map((b) => {
    const carry = Math.min(b.paidLeave.remaining || 0, 15);

    return {
      employee: b.employee,
      year,
      paidLeave: { total: (b.paidLeave.total || 12) + carry },
      sickLeave: { total: b.sickLeave.total || 7 },
      casualLeave: { total: b.casualLeave.total || 10 },
      carryForward: carry,
    };
  });

  return await this.insertMany(docs);
};

//
// Instance: deduct leave
//
leaveBalanceSchema.methods.deductLeave = async function (leaveType, days) {
  const map = {
    Paid: "paidLeave",
    Sick: "sickLeave",
    Casual: "casualLeave",
    Maternity: "maternityLeave",
    Paternity: "paternityLeave",
  };

  const field = map[leaveType];
  if (!field) throw new Error("Invalid leave type");

  if (this[field].remaining < days)
    throw new Error(`Insufficient ${leaveType} leave balance`);

  this[field].used += days;

  return await this.save();
};

//
// Instance: restore leave
//
leaveBalanceSchema.methods.restoreLeave = async function (leaveType, days) {
  const map = {
    Paid: "paidLeave",
    Sick: "sickLeave",
    Casual: "casualLeave",
    Maternity: "maternityLeave",
    Paternity: "paternityLeave",
  };

  const field = map[leaveType];
  if (!field) throw new Error("Invalid leave type");

  this[field].used = Math.max(0, this[field].used - days);

  return await this.save();
};

//
// Instance: admin adjust leave
//
leaveBalanceSchema.methods.adjustLeave = async function (leaveType, totalDays) {
  const map = {
    Paid: "paidLeave",
    Sick: "sickLeave",
    Casual: "casualLeave",
    Maternity: "maternityLeave",
    Paternity: "paternityLeave",
  };

  const field = map[leaveType];

  this[field].total = Math.max(0, totalDays);

  return await this.save();
};

//
// Check balance
//
leaveBalanceSchema.methods.hasSufficientBalance = function (leaveType, days) {
  if (leaveType === "Unpaid") return true;
  const map = {
    Paid: "paidLeave",
    Sick: "sickLeave",
    Casual: "casualLeave",
    Maternity: "maternityLeave",
    Paternity: "paternityLeave",
  };

  const field = map[leaveType];
  return field && this[field].remaining >= days;
};

//
// Virtuals
//
leaveBalanceSchema.virtual("totalAvailable").get(function () {
  return (
    this.paidLeave.remaining +
    this.sickLeave.remaining +
    this.casualLeave.remaining +
    this.maternityLeave.remaining +
    this.paternityLeave.remaining
  );
});

leaveBalanceSchema.virtual("totalAllocated").get(function () {
  return (
    this.paidLeave.total +
    this.sickLeave.total +
    this.casualLeave.total +
    this.maternityLeave.total +
    this.paternityLeave.total
  );
});

leaveBalanceSchema.set("toJSON", { virtuals: true });
leaveBalanceSchema.set("toObject", { virtuals: true });

export default mongoose.model("LeaveBalance", leaveBalanceSchema);
