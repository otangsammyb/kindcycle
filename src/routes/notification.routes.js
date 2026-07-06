const express = require('express');
const router = express.Router();
const { verifyToken, optionalAuth } = require('../middleware/auth');
const notificationService = require('../services/notification.service');
const Notification = require('../models/Notification');

// GET /api/notifications/stream  — SSE endpoint
router.get('/stream', verifyToken, (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  const userId = req.user._id.toString();

  // Send initial ping
  res.write(':ok\n\n');

  notificationService.addClient(userId, res);

  // Heartbeat every 30s
  const interval = setInterval(() => {
    try { res.write(':ping\n\n'); } catch { clearInterval(interval); }
  }, 30000);

  req.on('close', () => {
    clearInterval(interval);
    notificationService.removeClient(userId, res);
  });
});

// GET /api/notifications  — list user's notifications
router.get('/', verifyToken, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const [notifications, total, unread] = await Promise.all([
    Notification.find({ user: req.user._id })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit)),
    Notification.countDocuments({ user: req.user._id }),
    Notification.countDocuments({ user: req.user._id, read: false }),
  ]);
  res.json({ success: true, data: { notifications, total, unread, page: parseInt(page), pages: Math.ceil(total / limit) } });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', verifyToken, async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ success: true });
});

// PATCH /api/notifications/read-all
router.patch('/read-all', verifyToken, async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true });
});

module.exports = router;
