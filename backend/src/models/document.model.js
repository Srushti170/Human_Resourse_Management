import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
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
        "Other"
      ],
      required: true,
      index: true
    },

    documentName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500
    },

    documentUrl: {
      type: String,
      required: true,
      trim: true
    },

    fileSize: {
      type: Number,
      min: 0
    },

    mimeType: String,

    fileExtension: {
      type: String,
      lowercase: true,
      trim: true
    },

    cloudinaryPublicId: String,

    documentNumber: String,

    issueDate: Date,

    expiryDate: {
      type: Date,
      validate(value) {
        if (!value || !this.issueDate) return true;
        return value > this.issueDate;
      }
    },

    isVerified: {
      type: Boolean,
      default: false,
      index: true
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    verifiedAt: Date,

    verificationNotes: {
      type: String,
      trim: true,
      maxlength: 500
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    status: {
      type: String,
      enum: ["Active", "Archived", "Expired", "Rejected"],
      default: "Active",
      index: true
    },

    isConfidential: {
      type: Boolean,
      default: false
    },

    accessibleBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    tags: [
      {
        type: String,
        trim: true
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
// 📌 Helpful indexes
//
documentSchema.index({ employee: 1, documentType: 1 });
documentSchema.index({ expiryDate: 1 });


//
// ⚙️ Auto-extract extension
//
documentSchema.pre("save", function () {
  if (this.documentUrl && !this.fileExtension) {
    const ext = this.documentUrl.split(".").pop();
    this.fileExtension = String(ext).toLowerCase();
  }
});


//
// ⚠️ Auto-expire
//
documentSchema.pre("save", function () {
  if (this.expiryDate && new Date() > this.expiryDate) {
    this.status = "Expired";
  }
});


//
// ✔️ Auto timestamp verification
//
documentSchema.pre("save", function () {
  if (this.isModified("isVerified")) {
    this.verifiedAt = this.isVerified ? new Date() : null;
  }
});


//
// 🧭 Static Methods
//
documentSchema.statics.getEmployeeDocuments = async function (
  employeeId,
  options = {}
) {
  const query = {
    employee: new mongoose.Types.ObjectId(employeeId),
    isDeleted: false
  };

  if (options.type) query.documentType = options.type;
  if (options.status) query.status = options.status;

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate("uploadedBy", "firstName lastName")
    .populate("verifiedBy", "firstName lastName");
};

documentSchema.statics.getExpiringDocuments = async function (days = 30) {
  const today = new Date();
  const future = new Date(today.getTime() + days * 86400000);

  return this.find({
    expiryDate: { $gte: today, $lte: future },
    status: "Active",
    isDeleted: false
  })
    .populate("employee", "firstName lastName email employeeId")
    .sort({ expiryDate: 1 });
};

documentSchema.statics.getDocumentsByType = async function (type) {
  return this.find({
    documentType: type,
    status: "Active",
    isDeleted: false
  })
    .populate("employee", "firstName lastName employeeId")
    .sort({ createdAt: -1 });
};


//
// 🧭 Instance Methods
//
documentSchema.methods.isExpired = function () {
  return Boolean(this.expiryDate && new Date() > this.expiryDate);
};

documentSchema.methods.isExpiringSoon = function (days = 30) {
  if (!this.expiryDate) return false;

  const today = new Date();
  const future = new Date(today.getTime() + days * 86400000);

  return this.expiryDate >= today && this.expiryDate <= future;
};

documentSchema.methods.verify = async function (verifierId, notes = "") {
  this.isVerified = true;
  this.verifiedBy = verifierId;
  this.verifiedAt = new Date();
  this.verificationNotes = notes;
  return this.save();
};

documentSchema.methods.revokeVerification = async function () {
  this.isVerified = false;
  this.verifiedBy = null;
  this.verifiedAt = null;
  return this.save();
};

documentSchema.methods.archive = async function () {
  this.status = "Archived";
  return this.save();
};

documentSchema.methods.restore = async function () {
  this.status = "Active";
  this.isDeleted = false;
  return this.save();
};


//
// 🎯 Virtuals
//
documentSchema.virtual("fileSizeMB").get(function () {
  return this.fileSize
    ? (this.fileSize / (1024 * 1024)).toFixed(2)
    : "0.00";
});

documentSchema.virtual("daysUntilExpiry").get(function () {
  if (!this.expiryDate) return null;
  const diff = this.expiryDate - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

documentSchema.set("toJSON", { virtuals: true });
documentSchema.set("toObject", { virtuals: true });

export default mongoose.model("Document", documentSchema);
