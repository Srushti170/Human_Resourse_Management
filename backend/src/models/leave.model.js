import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    leaveType: {
      type: String,
      enum: ["Paid", "Sick", "Unpaid", "Casual", "Maternity", "Paternity"],
      required: true
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    numberOfDays: {
      type: Number,
      min: 0.5,
      required: true
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 500
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: 500
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected", "Cancelled"],
      default: "Pending",
      index: true
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    approvedAt: Date,

    approverComments: {
      type: String,
      trim: true,
      maxlength: 500
    },

    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);

//
//  VALIDATIONS
//

// prevent past dated start when creating
leaveSchema.path("startDate").validate(function (value) {
  if (!this.isNew) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return value >= today;
}, "Start date cannot be in the past");

// ensure end >= start
leaveSchema.path("endDate").validate(function (value) {
  return value >= this.startDate;
}, "End date must be after start date");


//
//  PRE-SAVE — auto compute days + approval time + overlap check
//
leaveSchema.pre("save", async function () {
  // calculate number of days
  if (this.startDate && this.endDate) {
    const s = new Date(this.startDate);
    const e = new Date(this.endDate);

    const diff = (e - s) / (1000 * 60 * 60 * 24) + 1;

    this.numberOfDays = Math.max(0.5, diff);
  }

  // set approval timestamp
  if (
    this.isModified("status") &&
    ["Approved", "Rejected"].includes(this.status)
  ) {
    this.approvedAt = new Date();
  }

  // prevent overlapping leave
  const overlapping = await this.constructor.findOne({
    employee: this.employee,
    status: { $in: ["Pending", "Approved"] },
    _id: { $ne: this._id },
    startDate: { $lte: this.endDate },
    endDate: { $gte: this.startDate }
  });

  if (overlapping) {
    throw new Error("Overlapping leave request exists");
  }
});


//
//  STATIC METHODS
//

leaveSchema.statics.checkOverlap = async function (
  employeeId,
  startDate,
  endDate,
  exclude
) {
  return this.exists({
    employee: new mongoose.Types.ObjectId(employeeId),
    status: { $in: ["Pending", "Approved"] },
    _id: exclude ? { $ne: exclude } : { $exists: true },
    startDate: { $lte: endDate },
    endDate: { $gte: startDate }
  });
};

leaveSchema.statics.getLeaveHistory = async function (employeeId, year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  return this.find({
    employee: employeeId,
    startDate: { $gte: start, $lte: end }
  })
    .sort({ startDate: -1 })
    .populate("approvedBy", "firstName lastName username");
};

leaveSchema.statics.getLeaveStatsByType = async function (employeeId, year) {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  return this.aggregate([
    {
      $match: {
        employee: new mongoose.Types.ObjectId(employeeId),
        startDate: { $gte: start, $lte: end },
        status: "Approved"
      }
    },
    {
      $group: {
        _id: "$leaveType",
        totalDays: { $sum: "$numberOfDays" },
        count: { $sum: 1 }
      }
    }
  ]);
};


//
//  INSTANCE METHODS
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
  return this.save();
};

leaveSchema.methods.reject = async function (approverId, comments = "") {
  this.status = "Rejected";
  this.approvedBy = approverId;
  this.approverComments = comments || "Rejected";
  return this.save();
};

leaveSchema.methods.cancel = async function () {
  this.status = "Cancelled";
  return this.save();
};

export default mongoose.model("Leave", leaveSchema);
