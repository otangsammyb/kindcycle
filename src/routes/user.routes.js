const express = require('express');
const router = express.Router();
const {
  getMyProfile, updateMyProfile, changePassword, uploadIdScan,
  getUserProfile, getNotifications, markNotificationRead, markAllRead, deactivateAccount
} = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth');
const { uploadIdScan: multerIdScan } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

// Protected
router.get('/me', verifyToken, getMyProfile);
router.patch('/me', verifyToken, updateMyProfile);
router.put('/me/password', verifyToken, changePassword);
router.post('/me/id-scan', verifyToken, uploadLimiter, multerIdScan, uploadIdScan);
router.delete('/me', verifyToken, deactivateAccount);

// Notifications
router.get('/notifications', verifyToken, getNotifications);
router.patch('/notifications/:id/read', verifyToken, markNotificationRead);
router.patch('/notifications/read-all', verifyToken, markAllRead);

// Public profile
router.get('/:id', getUserProfile);

module.exports = router;
