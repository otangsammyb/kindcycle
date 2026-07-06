const multer = require('multer');
const mongoose = require('mongoose');
// Using mongoose.mongo to ensure BSON versions match exactly with what Mongoose expects
const crypto = require('crypto');
const path = require('path');
const { Readable } = require('stream');

const MAX_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;

// Memory storage for temporary buffer
const storage = multer.memoryStorage();

// Manual GridFS upload helper
const uploadToGridFS = (file, bucketName, metadata = {}) => {
  return new Promise((resolve, reject) => {
    if (!mongoose.connection.db) {
      return reject(new Error('Database connection not established'));
    }

    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: bucketName
    });

    const filename = crypto.randomBytes(16).toString('hex') + path.extname(file.originalname);
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        ...metadata,
        originalName: file.originalname,
        uploadedAt: new Date()
      },
      contentType: file.mimetype
    });

    const readableStream = new Readable();
    readableStream.push(file.buffer);
    readableStream.push(null);

    readableStream.pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => {
        resolve({
          id: uploadStream.id,
          filename: filename,
          metadata: uploadStream.options.metadata,
          bucketName: bucketName
        });
      });
  });
};

const multerUpload = multer({
  storage,
  limits: { fileSize: MAX_SIZE }
});

// Middleware for ID Scan
const uploadIdScan = (req, res, next) => {
  multerUpload.single('idScan')(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next();

    try {
      const allowed = /^image\/(jpeg|png|jpg|webp)$|^application\/pdf$/;
      if (!allowed.test(req.file.mimetype)) throw new Error('Invalid file type');

      const result = await uploadToGridFS(req.file, 'idScans', { userId: req.user?._id });
      req.file.gridfs = result;
      next();
    } catch (error) {
      next(error);
    }
  });
};

// Middleware for Item Images
const uploadItemImages = (req, res, next) => {
  multerUpload.array('images', 5)(req, res, async (err) => {
    if (err) return next(err);
    if (!req.files || req.files.length === 0) return next();

    try {
      const allowed = /^image\/(jpeg|png|jpg|webp)$/;
      const uploadPromises = req.files.map(file => {
        if (!allowed.test(file.mimetype)) throw new Error('Invalid file type');
        return uploadToGridFS(file, 'itemImages', { uploadedBy: req.user?._id });
      });

      const results = await Promise.all(uploadPromises);
      req.files.forEach((file, i) => {
        file.gridfs = results[i];
      });
      next();
    } catch (error) {
      next(error);
    }
  });
};

module.exports = { uploadIdScan, uploadItemImages, memStorage: multerUpload };
