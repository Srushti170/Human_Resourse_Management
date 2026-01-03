import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    leaveType: {
      type: String,
      enum: ["Paid", "Sick", "Unpaid", "Casual", "Maternity", "Paternity"],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    numberOfDays: {
      type: Number,
      required: true,
      min: 0.5,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500,
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
      required: true,
      index: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: Date,

    approverComments: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

//
// VALIDATIONS
//

// Prevent past-dated new leave
leaveSchema.path("startDate").validate(function (value) {
  if (!this.isNew) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return value >= today;
}, "Start date cannot be in the past");

// End after start
leaveSchema.path("endDate").validate(function (value) {
  return value >= this.startDate;
}, "End date must be after or equal to start date");

//
// CALCULATE NUMBER OF DAYS
//
leaveSchema.pre("save", function (next) {
  if (this.startDate && this.endDate) {
    const s = new Date(this.startDate);
    const e = new Date(this.endDate);

    const diff = (e - s) / (1000 * 60 * 60 * 24) + 1;

    this.numberOfDays = Math.max(0.5, diff);
  }

  // set approval time
  if (
    this.isModified("status") &&
    ["Approved", "Rejected"].includes(this.status)
  ) {
    this.approvedAt = new Date();
  }

  next();
});

//
// Prevent overlapping leave
//
leaveSchema.pre("save", async function (next) {
  if (!this.isModified("startDate") && !this.isModified("endDate")) return next();

  const overlap = await this.constructor.findOne({
    employee: this.employee,
    status: { $in: ["Pending", "Approved"] },
    _id: { $ne: this._id },
    startDate: { $lte: this.endDate },
    endDate: { $gte: this.startDate },
  });

  if (overlap) {
    return next(new Error("Overlapping leave request exists"));
  }

  next();
});

//
// STATIC — Overlap API helper
//
leaveSchema.statics.checkOverlap = async function (
  employeeId,
  startDate,
  endDate,
  exclude = null
) {
  return await this.exists({
    employee: new mongoose.Types.ObjectId(employeeId),
    status: { $in: ["Pending", "Approved"] },
    _id: exclude ? { $ne: exclude } : { $exists: true },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
  });
};

//
// STATIC — History
//
leaveSchema.statics.getLeaveHistory = async function (employeeId, year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  return await this.find({
    employee: employeeId,
    startDate: { $gte: start, $lte: end },
  })
    .sort({ startDate: -1 })
    .populate("approvedBy", "firstName lastName username");
};

//
// STATIC — Stats by type
//
leaveSchema.statics.getLeaveStatsByType = async function (employeeId, year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  return await this.aggregate([
    {
      $match: {
        employee: new mongoose.Types.ObjectId(employeeId),
        startDate: { $gte: start, $lte: end },
        status: "Approved",
      },
    },
    {
      $group: {
        _id: "$leaveType",
        totalDays: { $sum: "$numberOfDays" },
        count: { $sum: 1 },
      },
    },
  ]);
};

//
// INSTANCE HELPERS
//
leaveSchema.methods.canBeCancelled = function () {
  return (
    this.status === "Pending" ||
    (this.status === "Approved" && this.startDate > new Date())
  );
};

leaveSchema.methods.canBeEdited = function () {
  return this.status === "Pending";
};

leaveSchema.methods.approve = async function (approverId, comments = "") {
  this.status = "Approved";
  this.approvedBy = approverId;
  this.approverComments = comments;
  return await this.save();
};

leaveSchema.methods.reject = async function (approverId, comments) {
  this.status = "Rejected";
  this.approvedBy = approverId;
  this.approverComments = comments || "Rejected";
  return await this.save();
};

leaveSchema.methods.cancel = async function () {
  this.status = "Cancelled";
  return await this.save();
};

export default mongoose.model("Leave", leaveSchema);
