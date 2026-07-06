const PrintJob = require('../models/PrintJob');

/**
 * Deletes all expired print jobs from database.
 * Called by cron job and can be triggered manually.
 */
const autoDeleteExpiredFiles = async () => {
  try {
    const now = new Date();
    const result = await PrintJob.deleteMany({
      expiresAt: { $lte: now },
    });
    if (result.deletedCount > 0) {
      console.log(`🗑️  Auto-deleted ${result.deletedCount} expired print job(s).`);
    }
  } catch (err) {
    console.error('Error during auto-delete:', err.message);
  }
};

module.exports = { autoDeleteExpiredFiles };
