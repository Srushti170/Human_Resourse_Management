import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    action: {
      type: String,
      required: true,
      enum: [
        "LOGIN",
        "LOGOUT",
        "PASSWORD_RESET",
        "EMAIL_VERIFICATION",

        "PROFILE_UPDATED",
        "PROFILE_PICTURE_UPDATED",

        "CHECK_IN",
        "CHECK_OUT",
        "ATTENDANCE_UPDATED",
        "ATTENDANCE_VIEWED",

        "LEAVE_APPLIED",
        "LEAVE_APPROVED",
        "LEAVE_REJECTED",
        "LEAVE_CANCELLED",
        "LEAVE_UPDATED",

        "PAYROLL_VIEWED",
        "PAYROLL_UPDATED",
        "PAYROLL_GENERATED",
        "SALARY_SLIP_DOWNLOADED",

        "DOCUMENT_UPLOADED",
        "DOCUMENT_DOWNLOADED",
        "DOCUMENT_DELETED",
        "DOCUMENT_VERIFIED",

        "USER_CREATED",
        "USER_UPDATED",
        "USER_DELETED",
        "USER_ACTIVATED",
        "USER_DEACTIVATED",

        "SETTINGS_UPDATED",
        "REPORT_GENERATED",
        "DATA_EXPORTED",

        "OTHER",
      ],
      index: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    ipAddress: String,
    userAgent: String,

    device: {
      type: {
        type: String,
        enum: ["Desktop", "Mobile", "Tablet", "Other"],
        default: "Other",
      },
      os: String,
      browser: String,
    },

    resourceType: {
      type: String,
      enum: [
        "User",
        "Attendance",
        "Leave",
        "Payroll",
        "Document",
        "Notification",
        "Other",
      ],
    },

    resourceId: mongoose.Schema.Types.ObjectId,

    status: {
      type: String,
      enum: ["Success", "Failed", "Pending"],
      default: "Success",
      index: true,
    },

    errorMessage: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    changes: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
      index: true,
    },

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
// INDEXES
//
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ resourceType: 1, resourceId: 1 });
activityLogSchema.index({ status: 1 });
activityLogSchema.index({ createdAt: -1 });

// optional TTL (kept but soft-deletes preferred)
activityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 31536000, partialFilterExpression: { severity: "Low" } }
);

//
// AUTO severity escalation on failure
//
activityLogSchema.pre("save", function (next) {
  if (this.status === "Failed" && this.severity === "Low") {
    this.severity = "High";
  }
  next();
});

//
// STATIC HELPERS
//
activityLogSchema.statics.log = async function (data) {
  try {
    return await this.create(data);
  } catch (err) {
    console.error("ActivityLog error:", err.message);
    return null;
  }
};

activityLogSchema.statics.fromRequest = async function ({
  req,
  userId,
  action,
  description,
  resourceType,
  resourceId,
  status = "Success",
  severity = "Low",
}) {
  return await this.log({
    user: userId,
    action,
    description,
    resourceType,
    resourceId,
    status,
    severity,
    ipAddress: req?.ip,
    userAgent: req?.headers?.["user-agent"],
  });
};

activityLogSchema.statics.getUserLogs = async function (
  userId,
  { limit = 50, skip = 0, startDate, endDate, action } = {}
) {
  const query = {
    user: new mongoose.Types.ObjectId(userId),
    isDeleted: false,
  };

  if (action) query.action = action;

  if (startDate && endDate)
    query.createdAt = { $gte: startDate, $lte: endDate };

  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
};

activityLogSchema.statics.getRecentActivity = async function (
  limit = 20,
  filters = {}
) {
  const query = { isDeleted: false };

  if (filters.user) query.user = filters.user;
  if (filters.action) query.action = filters.action;
  if (filters.resourceType) query.resourceType = filters.resourceType;

  return await this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("user", "firstName lastName email employeeId")
    .lean();
};

activityLogSchema.statics.getActivityStats = async function (start, end) {
  return await this.aggregate([
    {
      $match: { createdAt: { $gte: start, $lte: end } },
    },
    {
      $group: {
        _id: "$action",
        count: { $sum: 1 },
        success: {
          $sum: { $cond: [{ $eq: ["$status", "Success"] }, 1, 0] },
        },
        failed: {
          $sum: { $cond: [{ $eq: ["$status", "Failed"] }, 1, 0] },
        },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

activityLogSchema.statics.getLoginHistory = async function (
  userId,
  limit = 10
) {
  return await this.find({
    user: userId,
    action: "LOGIN",
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("createdAt ipAddress userAgent device status")
    .lean();
};

activityLogSchema.statics.detectSuspiciousActivity = async function (
  userId,
  windowMinutes = 60
) {
  const since = new Date(Date.now() - windowMinutes * 60000);

  const failedAttempts = await this.countDocuments({
    user: userId,
    action: { $in: ["LOGIN", "PASSWORD_RESET"] },
    status: "Failed",
    createdAt: { $gte: since },
  });

  const uniqueIps = await this.distinct("ipAddress", {
    user: userId,
    createdAt: { $gte: since },
  });

  return {
    failedAttempts,
    suspiciousIPCount: uniqueIps.length,
    isSuspicious: failedAttempts > 5 || uniqueIps.length > 3,
  };
};

activityLogSchema.statics.deleteOldLogs = async function (days = 365) {
  const cutoff = new Date(Date.now() - days * 86400000);

  const res = await this.updateMany(
    { createdAt: { $lt: cutoff } },
    { $set: { isDeleted: true } }
  );

  return res.modifiedCount;
};

//
// VIRTUALS
//
activityLogSchema.virtual("formattedDate").get(function () {
  return this.createdAt.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
});

activityLogSchema.virtual("actionDisplayName").get(function () {
  return this.action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
});

activityLogSchema.set("toJSON", { virtuals: true });
activityLogSchema.set("toObject", { virtuals: true });

export default mongoose.model("ActivityLog", activityLogSchema);
