import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: [
        "Leave",
        "Attendance",
        "Payroll",
        "Document",
        "System",
        "Alert",
        "Approval",
        "Reminder",
        "Welcome",
        "Other",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: Date,

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
      index: true,
    },

    referenceType: {
      type: String,
      enum: ["Leave", "Attendance", "Payroll", "Document", "User", "Other"],
    },

    referenceId: mongoose.Schema.Types.ObjectId,

    actionUrl: {
      type: String,
      trim: true,
    },

    actionText: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    emailSent: {
      type: Boolean,
      default: false,
    },

    smsSent: {
      type: Boolean,
      default: false,
    },

    expiresAt: Date,

    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Soft delete support
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

//
// Indexes
//
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 });

//
// Auto timestamp readAt
//
notificationSchema.pre("save", function (next) {
  if (this.isModified("isRead") && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

//
// Static – create single notification
//
notificationSchema.statics.createNotification = async function (data) {
  const notification = await this.create(data);
  return notification;
};

//
// Static – bulk create
//
notificationSchema.statics.createManyNotifications = async function (list = []) {
  if (!Array.isArray(list)) throw new Error("Input must be an array");
  return await this.insertMany(list);
};

//
// Static – unread list
//
notificationSchema.statics.getUnreadNotifications = async function (userId) {
  return await this.find({
    recipient: new mongoose.Types.ObjectId(userId),
    isRead: false,
    isDeleted: false,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
  })
    .sort({ createdAt: -1 })
    .populate("sender", "firstName lastName email username");
};

//
// Static – unread count
//
notificationSchema.statics.getUnreadCount = async function (userId) {
  return await this.countDocuments({
    recipient: new mongoose.Types.ObjectId(userId),
    isRead: false,
    isDeleted: false,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
  });
};

//
// Static – mark all as read
//
notificationSchema.statics.markAllAsRead = async function (userId) {
  return await this.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

//
// Soft delete old notifications
//
notificationSchema.statics.deleteOldNotifications = async function (daysOld = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  return await this.updateMany(
    { createdAt: { $lt: cutoff } },
    { $set: { isDeleted: true } }
  );
};

//
// Instance – mark single read
//
notificationSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
  }
  return await this.save();
};

//
// Instance – expired flag
//
notificationSchema.methods.isExpired = function () {
  return Boolean(this.expiresAt && new Date() > this.expiresAt);
};

//
// Instance – lightweight JSON payload for sockets
//
notificationSchema.methods.toPushPayload = function () {
  return {
    id: this._id,
    title: this.title,
    message: this.message,
    type: this.type,
    priority: this.priority,
    createdAt: this.createdAt,
    isRead: this.isRead,
    actionUrl: this.actionUrl,
  };
};

//
// Virtual – friendly age
//
notificationSchema.virtual("age").get(function () {
  const diff = (Date.now() - this.createdAt) / 1000;

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
  return this.createdAt.toLocaleDateString();
});

notificationSchema.set("toJSON", { virtuals: true });
notificationSchema.set("toObject", { virtuals: true });

export default mongoose.model("Notification", notificationSchema);
