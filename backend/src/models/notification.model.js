import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
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
        "Other"
      ],
      required: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true
    },

    readAt: Date,

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
      index: true
    },

    referenceType: {
      type: String,
      enum: ["Leave", "Attendance", "Payroll", "Document", "User", "Other"]
    },

    referenceId: mongoose.Schema.Types.ObjectId,

    actionUrl: String,

    actionText: {
      type: String,
      maxlength: 50
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    emailSent: {
      type: Boolean,
      default: false
    },

    smsSent: {
      type: Boolean,
      default: false
    },

    expiresAt: Date,

    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true }
);


//
// INDEXES
//
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 });


//
// AUTO-SET readAt (no next)
//
notificationSchema.pre("save", function () {
  if (this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
});


//
// 🔹 STATIC METHODS
//

// single notification
notificationSchema.statics.createNotification = async function (data) {
  return this.create(data);
};

// multiple notifications
notificationSchema.statics.createManyNotifications = async function (list = []) {
  if (!Array.isArray(list)) throw new Error("Input must be an array");
  return this.insertMany(list);
};

// unread list
notificationSchema.statics.getUnreadNotifications = async function (userId) {
  return this.find({
    recipient: new mongoose.Types.ObjectId(userId),
    isRead: false,
    isDeleted: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  })
    .sort({ createdAt: -1 })
    .populate("sender", "firstName lastName email username");
};

// unread count
notificationSchema.statics.getUnreadCount = async function (userId) {
  return this.countDocuments({
    recipient: new mongoose.Types.ObjectId(userId),
    isRead: false,
    isDeleted: false,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// mark all as read
notificationSchema.statics.markAllAsRead = async function (userId) {
  return this.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
};

// soft delete old
notificationSchema.statics.deleteOldNotifications = async function (days = 30) {
  const cutoff = new Date(Date.now() - days * 86400000);

  return this.updateMany(
    { createdAt: { $lt: cutoff } },
    { $set: { isDeleted: true } }
  );
};


//
// 🔹 INSTANCE METHODS
//

notificationSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
  }
  return this.save();
};

notificationSchema.methods.isExpired = function () {
  return Boolean(this.expiresAt && new Date() > this.expiresAt);
};

notificationSchema.methods.toPushPayload = function () {
  return {
    id: this._id,
    title: this.title,
    message: this.message,
    type: this.type,
    priority: this.priority,
    createdAt: this.createdAt,
    isRead: this.isRead,
    actionUrl: this.actionUrl
  };
};


//
// 🔹 VIRTUALS
//

notificationSchema.virtual("age").get(function () {
  const seconds = (Date.now() - this.createdAt) / 1000;

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hrs ago`;

  return this.createdAt.toLocaleDateString();
});

notificationSchema.set("toJSON", { virtuals: true });
notificationSchema.set("toObject", { virtuals: true });

export default mongoose.model("Notification", notificationSchema);
