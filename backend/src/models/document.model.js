import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee reference is required']
  },
  
  documentType: {
    type: String,
    enum: {
      values: [
        'Resume',
        'ID Proof',
        'Address Proof',
        'Educational Certificate',
        'Experience Letter',
        'Offer Letter',
        'Appointment Letter',
        'Salary Slip',
        'Tax Document',
        'Medical Certificate',
        'Other'
      ],
      message: '{VALUE} is not a valid document type'
    },
    required: [true, 'Document type is required']
  },
  
  documentName: {
    type: String,
    required: [true, 'Document name is required'],
    trim: true,
    maxlength: [200, 'Document name cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  documentUrl: {
    type: String,
    required: [true, 'Document URL is required']
  },
  
  // File Details
  fileSize: {
    type: Number,
    min: [0, 'File size cannot be negative']
  },
  mimeType: {
    type: String,
    trim: true
  },
  fileExtension: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  // Cloud Storage Details (optional)
  cloudinaryPublicId: {
    type: String
  },
  
  // Document Metadata
  documentNumber: {
    type: String,
    trim: true
  },
  issueDate: {
    type: Date
  },
  expiryDate: {
    type: Date,
    validate: {
      validator: function(value) {
        if (!value || !this.issueDate) return true;
        return value > this.issueDate;
      },
      message: 'Expiry date must be after issue date'
    }
  },
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  verificationNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Verification notes cannot exceed 500 characters']
  },
  
  // Upload Info
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['Active', 'Archived', 'Expired', 'Rejected'],
    default: 'Active'
  },
  
  // Access Control
  isConfidential: {
    type: Boolean,
    default: false
  },
  accessibleBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Tags for better organization
  tags: [{
    type: String,
    trim: true
  }],
  
}, {
  timestamps: true
});

// Indexes for better query performance
documentSchema.index({ employee: 1, documentType: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ isVerified: 1 });
documentSchema.index({ expiryDate: 1 });

// Pre-save middleware to extract file extension
documentSchema.pre('save', function(next) {
  if (this.documentUrl && !this.fileExtension) {
    const urlParts = this.documentUrl.split('.');
    this.fileExtension = urlParts[urlParts.length - 1].toLowerCase();
  }
  next();
});

// Pre-save middleware to check expiry status
documentSchema.pre('save', function(next) {
  if (this.expiryDate && new Date() > this.expiryDate && this.status !== 'Expired') {
    this.status = 'Expired';
  }
  next();
});

// Static method to get all documents for an employee
documentSchema.statics.getEmployeeDocuments = async function(employeeId, options = {}) {
  const query = { employee: employeeId };
  
  if (options.type) {
    query.documentType = options.type;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  return await this.find(query)
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'firstName lastName')
    .populate('verifiedBy', 'firstName lastName');
};

// Static method to get expiring documents
documentSchema.statics.getExpiringDocuments = async function(daysAhead = 30) {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);
  
  return await this.find({
    expiryDate: {
      $gte: today,
      $lte: futureDate
    },
    status: 'Active'
  })
  .populate('employee', 'firstName lastName email employeeId')
  .sort({ expiryDate: 1 });
};

// Static method to get documents by type
documentSchema.statics.getDocumentsByType = async function(documentType) {
  return await this.find({ documentType: documentType, status: 'Active' })
    .populate('employee', 'firstName lastName employeeId')
    .sort({ createdAt: -1 });
};

// Method to check if document is expired
documentSchema.methods.isExpired = function() {
  return this.expiryDate && new Date() > this.expiryDate;
};

// Method to check if document is expiring soon
documentSchema.methods.isExpiringSoon = function(days = 30) {
  if (!this.expiryDate) return false;
  
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  
  return this.expiryDate >= today && this.expiryDate <= futureDate;
};

// Method to verify document
documentSchema.methods.verify = async function(verifierId, notes) {
  this.isVerified = true;
  this.verifiedBy = verifierId;
  this.verifiedAt = Date.now();
  if (notes) {
    this.verificationNotes = notes;
  }
  return await this.save();
};

// Virtual for file size in MB
documentSchema.virtual('fileSizeMB').get(function() {
  return this.fileSize ? (this.fileSize / (1024 * 1024)).toFixed(2) : 0;
});

// Virtual for days until expiry
documentSchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  
  const today = new Date();
  const diffTime = this.expiryDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

documentSchema.set('toJSON', { virtuals: true });
documentSchema.set('toObject', { virtuals: true });

export default mongoose.model('Document', documentSchema);
