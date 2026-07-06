const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const multer = require('multer');
const PrintJob = require('../models/PrintJob');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');
const { encryptBuffer, decryptBuffer } = require('../utils/encryption');

// Multer stores file in memory (no disk writes of plaintext)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed.'));
    }
  },
});

// ─── CUSTOMER ROUTES ──────────────────────────────────────────────────────────

// POST /api/jobs/send  - Customer sends a file to a printer
router.post('/send', authenticate, requireRole('customer'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const { printerPublicId } = req.body;
    if (!printerPublicId) return res.status(400).json({ message: 'Printer ID is required.' });

    // Find printer
    const printer = await User.findOne({ role: 'printer', publicId: printerPublicId });
    if (!printer) return res.status(404).json({ message: 'Printer not found.' });

    // Encrypt the file buffer
    const { encryptedData, iv } = encryptBuffer(req.file.buffer);

    const job = new PrintJob({
      customerId: req.user._id,
      customerPublicId: req.user.publicId,
      customerName: req.user.name,
      printerId: printer._id,
      printerPublicId: printer.publicId,
      printerName: printer.printerName || printer.name,
      fileName: `${Date.now()}_${req.file.originalname}`,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      encryptedData,
      iv,
    });

    await job.save();

    res.status(201).json({
      message: 'File sent successfully.',
      job: {
        id: job._id,
        originalName: job.originalName,
        mimeType: job.mimeType,
        fileSize: job.fileSize,
        status: job.status,
        sentAt: job.sentAt,
        expiresAt: job.expiresAt,
        printerPublicId: job.printerPublicId,
      },
    });
  } catch (err) {
    console.error('Send job error:', err);
    if (err.message === 'Only PDF and image files are allowed.') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Failed to send file.' });
  }
});

// GET /api/jobs/my-sent  - Customer sees all their sent jobs
router.get('/my-sent', authenticate, requireRole('customer'), async (req, res) => {
  try {
    const jobs = await PrintJob.find({
      customerId: req.user._id,
      deletedByCustomer: false,
    })
      .select('-encryptedData -iv')
      .sort({ sentAt: -1 });

    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch jobs.' });
  }
});

// DELETE /api/jobs/:jobId  - Customer deletes a specific file
router.delete('/:jobId', authenticate, requireRole('customer'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) {
      return res.status(400).json({ message: 'Invalid job ID.' });
    }

    const result = await PrintJob.updateOne(
      { _id: req.params.jobId, customerId: req.user._id },
      { 
        $set: { 
          encryptedData: '', 
          iv: '', 
          deletedByCustomer: true, 
          status: 'deleted' 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Job not found or unauthorized.' });
    }

    res.json({ message: 'File deleted successfully.' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Failed to delete file.' });
  }
});

// DELETE /api/jobs/clear-all  - Customer deletes ALL their files from a printer
router.delete('/clear-all/:printerPublicId', authenticate, requireRole('customer'), async (req, res) => {
  try {
    await PrintJob.updateMany(
      {
        customerId: req.user._id,
        printerPublicId: req.params.printerPublicId,
        deletedByCustomer: false,
      },
      {
        $set: {
          encryptedData: '',
          iv: '',
          deletedByCustomer: true,
          status: 'deleted',
        },
      }
    );

    res.json({ message: 'All files cleared.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to clear files.' });
  }
});

// ─── PRINTER ROUTES ───────────────────────────────────────────────────────────

// GET /api/jobs/dashboard  - Printer sees all incoming jobs grouped by customer
router.get('/dashboard', authenticate, requireRole('printer'), async (req, res) => {
  try {
    // Only non-deleted jobs
    const jobs = await PrintJob.find({
      printerId: req.user._id,
      deletedByCustomer: false,
      status: { $ne: 'deleted' },
    })
      .select('-encryptedData -iv')
      .sort({ sentAt: -1 });

    // Group by customerPublicId
    const grouped = {};
    for (const job of jobs) {
      if (!grouped[job.customerPublicId]) {
        grouped[job.customerPublicId] = {
          customerPublicId: job.customerPublicId,
          customerName: job.customerName || 'Customer',
          latestSentAt: job.sentAt,
          jobCount: 0,
          jobs: [],
        };
      }
      grouped[job.customerPublicId].jobs.push({
        id: job._id,
        originalName: job.originalName,
        mimeType: job.mimeType,
        fileSize: job.fileSize,
        status: job.status,
        sentAt: job.sentAt,
        expiresAt: job.expiresAt,
      });
      grouped[job.customerPublicId].jobCount++;
      // Track most recent
      if (job.sentAt > grouped[job.customerPublicId].latestSentAt) {
        grouped[job.customerPublicId].latestSentAt = job.sentAt;
      }
    }

    // Sort customer groups by latest activity
    const customers = Object.values(grouped).sort(
      (a, b) => new Date(b.latestSentAt) - new Date(a.latestSentAt)
    );

    res.json({ customers });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard.' });
  }
});

// GET /api/jobs/view/:jobId  - Printer views a file (returns decrypted base64)
// SECURE: No download headers. Data URI only so browser renders inline.
router.get('/view/:jobId', authenticate, requireRole('printer'), async (req, res) => {
  try {
    const job = await PrintJob.findOne({
      _id: req.params.jobId,
      printerId: req.user._id,
      deletedByCustomer: false,
      status: { $ne: 'deleted' },
    });

    if (!job) return res.status(404).json({ message: 'File not found or removed by customer.' });

    if (!job.encryptedData) {
      return res.status(410).json({ message: 'File has been deleted.' });
    }

    const decryptedBuffer = decryptBuffer(job.encryptedData, job.iv);

    // Send as JSON to completely bypass download managers like IDM
    const base64Data = decryptedBuffer.toString('base64');
    res.json({
      mimeType: job.mimeType,
      fileBase64: base64Data
    });
  } catch (err) {
    console.error('View file error:', err);
    res.status(500).json({ message: 'Failed to retrieve file.' });
  }
});

// POST /api/jobs/print/:jobId  - Printer marks a job as printing/completed
router.post('/print/:jobId', authenticate, requireRole('printer'), async (req, res) => {
  try {
    const job = await PrintJob.findOne({
      _id: req.params.jobId,
      printerId: req.user._id,
      deletedByCustomer: false,
    });

    if (!job) return res.status(404).json({ message: 'Job not found.' });
    if (job.status === 'deleted') return res.status(400).json({ message: 'File deleted by customer.' });

    job.status = 'completed';
    await job.save();

    res.json({ message: 'Marked as printed.', status: job.status });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status.' });
  }
});

module.exports = router;
