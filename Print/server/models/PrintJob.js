const mongoose = require('mongoose');

const printJobSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customerPublicId: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  printerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  printerPublicId: {
    type: String,
    required: true,
  },
  printerName: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  fileSize: {
    type: Number,
    required: true,
  },
  // Encrypted file stored as base64 string
  encryptedData: {
    type: String,
    // Not required so we can wipe it on deletion
  },
  iv: {
    type: String,
    // Not required so we can wipe it on deletion
  },
  status: {
    type: String,
    enum: ['pending', 'printing', 'completed', 'deleted'],
    default: 'pending',
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + (parseInt(process.env.FILE_EXPIRY_HOURS || 24)) * 60 * 60 * 1000),
  },
  deletedByCustomer: {
    type: Boolean,
    default: false,
  },
});

// Auto-index for TTL (MongoDB native TTL — but we also do manual cron)
printJobSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PrintJob', printJobSchema);
