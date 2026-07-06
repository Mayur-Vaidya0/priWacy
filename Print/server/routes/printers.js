const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// GET /api/printers/search?q=PUBLICID
// Search for a printer by their public Printer ID
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ printers: [] });
    }

    const printers = await User.find({
      role: 'printer',
      $or: [
        { publicId: { $regex: q.trim(), $options: 'i' } },
        { printerName: { $regex: q.trim(), $options: 'i' } }
      ]
    })
      .select('publicId printerName location name createdAt')
      .limit(10);

    res.json({ printers });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Search failed.' });
  }
});

// GET /api/printers/:publicId  - get printer profile
router.get('/:publicId', authenticate, async (req, res) => {
  try {
    const printer = await User.findOne({
      role: 'printer',
      publicId: req.params.publicId,
    }).select('publicId printerName location name createdAt');

    if (!printer) return res.status(404).json({ message: 'Printer not found.' });

    res.json({ printer });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
