const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
// Use mongoose's internal mongodb driver
const { GridFSBucket } = mongoose.mongo;
const { verifyToken } = require('../middleware/auth');

const { LRUCache } = require('lru-cache');

const imageCache = new LRUCache({
  max: 100, // store up to 100 images in memory
  maxSize: 50 * 1024 * 1024, // 50MB max RAM usage
  sizeCalculation: (value) => value.length,
  ttl: 1000 * 60 * 60, // 1 hour cache
});

// GET /api/uploads/:fileId — stream GridFS file
router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Check ETag FIRST before doing anything
    if (req.headers['if-none-match'] === `"${fileId}"`) {
      return res.status(304).end();
    }

    // Is it in the cache?
    if (imageCache.has(fileId)) {
      const cached = imageCache.get(fileId);
      res.set('Content-Type', cached.contentType);
      res.set('Content-Length', cached.length);
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      res.set('ETag', `"${fileId}"`);
      return res.send(cached.buffer);
    }

    const db = mongoose.connection.db;

    // Determine bucket by checking both
    let bucket, file, matchedBucket = null;
    for (const bucketName of ['itemImages', 'idScans']) {
      bucket = new GridFSBucket(db, { bucketName });
      try {
        const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
        if (files.length > 0) { file = files[0]; matchedBucket = bucketName; break; }
      } catch { /* try next bucket */ }
    }

    if (!file) return res.status(404).json({ success: false, error: 'File not found' });

    // ID scans require authentication
    if (matchedBucket === 'idScans') {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ success: false, error: 'Authentication required for ID scans' });
    }

    // CDN headers
    res.set('Content-Type', file.contentType || 'application/octet-stream');
    res.set('Content-Length', file.length);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.set('ETag', `"${fileId}"`);

    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId));
    
    // Cache item images in memory for instant subsequent loads
    if (matchedBucket === 'itemImages') {
      const chunks = [];
      downloadStream.on('data', (chunk) => chunks.push(chunk));
      downloadStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        imageCache.set(fileId, { buffer, contentType: file.contentType, length: file.length });
      });
    }

    downloadStream.on('error', () => res.status(404).json({ success: false, error: 'File not found' }));
    downloadStream.pipe(res);
  } catch (err) {
    res.status(400).json({ success: false, error: 'Invalid file ID' });
  }
});

module.exports = router;
