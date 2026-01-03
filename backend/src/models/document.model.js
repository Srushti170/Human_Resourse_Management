import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    documentType: {
      type: String,
      enum: [
        "Resume",
        "ID Proof",
        "Address Proof",
        "Educational Certificate",
        "Experience Letter",
        "Offer Letter",
        "Appointment Letter",
        "Salary Slip",
        "Tax Document",
        "Medical Certificate",
        "Other",
      ],
      required: true,
      index: true,
    },

    documentName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    documentUrl: {
      type: String,
      required: true,
      trim: true,
    },

    fileSize: {
      type: Number,
      min: 0,
    },

    mimeType: {
      type: String,
      trim: true,
    },

    fileExtension: {
      type: String,
      trim: true,
      lowercase: true,
    },

    cloudinaryPublicId: String,

    documentNumber: {
      type: String,
      trim: true,
    },

    issueDate: Date,

    expiryDate: {
      type: Date,
      validate: {
        validator(v) {
          if (!v || !this.issueDate) return true;
          return v > this.issueDate;
        },
        message: "Expiry date must be after issue date",
      },
    },

    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    verifiedAt: Date,

    verificationNotes: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["Active", "Archived", "Expired", "Rejected"],
      default: "Active",
      index: true,
    },

    isConfidential: {
      type: Boolean,
      default: false,
    },

    accessibleBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    tags: [
      {
        type: String,
        trim: true,
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
// Indexes for dashboards
//
documentSchema.index({ employee: 1, documentType: 1 });
documentSchema.index({ expiryDate: 1 });

//
// Auto-set file extension
//
documentSchema.pre("save", function (next) {
  if (this.documentUrl && !this.fileExtension) {
    const parts = this.documentUrl.split(".");
    this.fileExtension = parts[parts.length - 1].toLowerCase();
  }
  next();
});

//
// Auto-expire status
//
documentSchema.pre("save", function (next) {
  if (this.expiryDate && new Date() > this.expiryDate) {
    this.status = "Expired";
  }
  next();
});

//
// Auto-set verification timestamp
//
documentSchema.pre("save", function (next) {
  if (this.isModified("isVerified")) {
    this.verifiedAt = this.isVerified ? new Date() : null;
  }
  next();
});

//
// 🔹 STATIC METHODS
//

// employee docs
documentSchema.statics.getEmployeeDocuments = async function (
  employeeId,
  options = {}
) {
  const query = {
    employee: new mongoose.Types.ObjectId(employeeId),
    isDeleted: false,
  };

  if (options.type) query.documentType = options.type;
  if (options.status) query.status = options.status;

  return await this.find(query)
    .sort({ createdAt: -1 })
    .populate("uploadedBy", "firstName lastName")
    .populate("verifiedBy", "firstName lastName");
};

// soon expiring
documentSchema.statics.getExpiringDocuments = async function (daysAhead = 30) {
  const today = new Date();
  const future = new Date();
  future.setDate(today.getDate() + daysAhead);

  return await this.find({
    expiryDate: { $gte: today, $lte: future },
    status: "Active",
    isDeleted: false,
  })
    .populate("employee", "firstName lastName email employeeId")
    .sort({ expiryDate: 1 });
};

// by type
documentSchema.statics.getDocumentsByType = async function (type) {
  return await this.find({
    documentType: type,
    status: "Active",
    isDeleted: false,
  })
    .populate("employee", "firstName lastName employeeId")
    .sort({ createdAt: -1 });
};

//
// 🔹 INSTANCE METHODS
//

documentSchema.methods.isExpired = function () {
  return Boolean(this.expiryDate && new Date() > this.expiryDate);
};

documentSchema.methods.isExpiringSoon = function (days = 30) {
  if (!this.expiryDate) return false;

  const today = new Date();
  const future = new Date();
  future.setDate(today.getDate() + days);

  return this.expiryDate >= today && this.expiryDate <= future;
};

documentSchema.methods.verify = async function (verifierId, notes = "") {
  this.isVerified = true;
  this.verifiedBy = verifierId;
  this.verifiedAt = new Date();
  this.verificationNotes = notes;
  return await this.save();
};

documentSchema.methods.revokeVerification = async function () {
  this.isVerified = false;
  this.verifiedBy = null;
  this.verifiedAt = null;
  return await this.save();
};

documentSchema.methods.archive = async function () {
  this.status = "Archived";
  return await this.save();
};

documentSchema.methods.restore = async function () {
  this.status = "Active";
  this.isDeleted = false;
  return await this.save();
};

//
// Virtuals
//
documentSchema.virtual("fileSizeMB").get(function () {
  return this.fileSize ? (this.fileSize / (1024 * 1024)).toFixed(2) : "0.00";
});

documentSchema.virtual("daysUntilExpiry").get(function () {
  if (!this.expiryDate) return null;

  const diff =
    (this.expiryDate.getTime() - new Date().getTime()) /
    (1000 * 60 * 60 * 24);

  return Math.ceil(diff);
});

documentSchema.set("toJSON", { virtuals: true });
documentSchema.set("toObject", { virtuals: true });

export default mongoose.model("Document", documentSchema);
