import mongoose from "mongoose";

const leaveTypeSchema = new mongoose.Schema(
  {
    total: { type: Number, default: 0, min: 0 },
    used: { type: Number, default: 0, min: 0 },
    remaining: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const leaveBalanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    year: {
      type: Number,
      required: true,
      min: 2020,
      max: 2100,
      default: () => new Date().getFullYear(),
      index: true
    },

    paidLeave: { type: leaveTypeSchema, default: {} },
    sickLeave: { type: leaveTypeSchema, default: {} },
    casualLeave: { type: leaveTypeSchema, default: {} },
    maternityLeave: { type: leaveTypeSchema, default: {} },
    paternityLeave: { type: leaveTypeSchema, default: {} },

    carryForward: {
      type: Number,
      default: 0,
      min: 0,
      max: 15
    },

    totalLeaveTaken: {
      type: Number,
      default: 0,
      min: 0
    },

    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// unique employee-year record
leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });


//
// Recompute helper (NO next)
//
function recompute(doc) {
  const fields = [
    "paidLeave",
    "sickLeave",
    "casualLeave",
    "maternityLeave",
    "paternityLeave"
  ];

  let total = 0;

  fields.forEach((f) => {
    doc[f] = doc[f] || {};

    doc[f].total = Number(doc[f].total || 0);
    doc[f].used = Number(doc[f].used || 0);
    doc[f].remaining = Math.max(0, doc[f].total - doc[f].used);

    total += doc[f].used;
  });

  doc.totalLeaveTaken = total;
  doc.lastUpdated = new Date();
}

//
// PRE-SAVE (promise style)
//
leaveBalanceSchema.pre("save", async function () {
  recompute(this);
});


//
// STATIC METHODS
//

// Initialize for new employee
leaveBalanceSchema.statics.initializeForEmployee = async function (
  employeeId,
  custom = {}
) {
  return this.create({
    employee: new mongoose.Types.ObjectId(employeeId),
    year: new Date().getFullYear(),
    paidLeave: { total: custom.paidLeave ?? 12 },
    sickLeave: { total: custom.sickLeave ?? 7 },
    casualLeave: { total: custom.casualLeave ?? 10 }
  });
};

// Get or create
leaveBalanceSchema.statics.getBalanceForEmployee = async function (
  employeeId,
  year = new Date().getFullYear()
) {
  let record = await this.findOne({
    employee: new mongoose.Types.ObjectId(employeeId),
    year
  });

  if (!record) {
    record = await this.initializeForEmployee(employeeId);
  }

  return record;
};

// Reset year with carry forward
leaveBalanceSchema.statics.resetForNewYear = async function (year) {
  const prevYear = year - 1;

  const previous = await this.find({ year: prevYear });

  const docs = previous.map((b) => {
    const carry = Math.min(b.paidLeave?.remaining ?? 0, 15);

    return {
      employee: b.employee,
      year,
      paidLeave: { total: (b.paidLeave?.total ?? 12) + carry },
      sickLeave: { total: b.sickLeave?.total ?? 7 },
      casualLeave: { total: b.casualLeave?.total ?? 10 },
      carryForward: carry
    };
  });

  return this.insertMany(docs);
};


//
// INSTANCE METHODS
//

const mapType = {
  Paid: "paidLeave",
  Sick: "sickLeave",
  Casual: "casualLeave",
  Maternity: "maternityLeave",
  Paternity: "paternityLeave"
};

leaveBalanceSchema.methods.deductLeave = async function (leaveType, days) {
  const field = mapType[leaveType];
  if (!field) throw new Error("Invalid leave type");

  if (this[field].remaining < days) {
    throw new Error(`Insufficient ${leaveType} leave balance`);
  }

  this[field].used += days;
  return this.save();
};

leaveBalanceSchema.methods.restoreLeave = async function (leaveType, days) {
  const field = mapType[leaveType];
  if (!field) throw new Error("Invalid leave type");

  this[field].used = Math.max(0, this[field].used - days);
  return this.save();
};

leaveBalanceSchema.methods.adjustLeave = async function (leaveType, totalDays) {
  const field = mapType[leaveType];
  if (!field) throw new Error("Invalid leave type");

  this[field].total = Math.max(0, totalDays);
  return this.save();
};

leaveBalanceSchema.methods.hasSufficientBalance = function (leaveType, days) {
  if (leaveType === "Unpaid") return true;

  const field = mapType[leaveType];
  if (!field) return false;

  return this[field].remaining >= days;
};


//
// VIRTUALS
//

leaveBalanceSchema.virtual("totalAvailable").get(function () {
  return (
    (this.paidLeave?.remaining ?? 0) +
    (this.sickLeave?.remaining ?? 0) +
    (this.casualLeave?.remaining ?? 0) +
    (this.maternityLeave?.remaining ?? 0) +
    (this.paternityLeave?.remaining ?? 0)
  );
});

leaveBalanceSchema.virtual("totalAllocated").get(function () {
  return (
    (this.paidLeave?.total ?? 0) +
    (this.sickLeave?.total ?? 0) +
    (this.casualLeave?.total ?? 0) +
    (this.maternityLeave?.total ?? 0) +
    (this.paternityLeave?.total ?? 0)
  );
});

leaveBalanceSchema.set("toJSON", { virtuals: true });
leaveBalanceSchema.set("toObject", { virtuals: true });

export default mongoose.model("LeaveBalance", leaveBalanceSchema);
