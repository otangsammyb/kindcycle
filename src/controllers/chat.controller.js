const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { createError } = require('../middleware/errorHandler');

// GET /api/chat/history/:userId
const getHistory = async (req, res) => {
  const otherUserId = req.params.userId;
  const { itemId } = req.query;

  const query = {
    $or: [
      { sender: req.user._id, receiver: otherUserId },
      { sender: otherUserId, receiver: req.user._id }
    ]
  };

  if (itemId) query.item = itemId;

  // Mark all unread messages from other user as read
  await Message.updateMany(
    { sender: otherUserId, receiver: req.user._id, read: false },
    { $set: { read: true } }
  );

  const messages = await Message.find(query).sort('createdAt').lean();

  res.json({ success: true, data: messages });
};

// GET /api/chat/conversations
const getConversations = async (req, res) => {
  // Aggregate distinct users the current user has chatted with
  const messages = await Message.find({
    $or: [{ sender: req.user._id }, { receiver: req.user._id }]
  }).sort('-createdAt').populate('sender', 'name avatar').populate('receiver', 'name avatar').populate('item', 'title');

  const convos = new Map();
  for (const msg of messages) {
    const isSender = msg.sender._id.toString() === req.user._id.toString();
    const partner = isSender ? msg.receiver : msg.sender;
    const partnerId = partner._id.toString();
    
    if (!convos.has(partnerId)) {
      convos.set(partnerId, {
        partner,
        lastMessage: msg.text,
        item: msg.item,
        timestamp: msg.createdAt,
        unread: !isSender && !msg.read ? 1 : 0
      });
    } else if (!isSender && !msg.read) {
      convos.get(partnerId).unread += 1;
    }
  }

  res.json({ success: true, data: Array.from(convos.values()) });
};

// POST /api/chat
const sendMessage = async (req, res) => {
  const { receiverId, itemId, text } = req.body;
  if (!receiverId || !text) throw createError('receiverId and text are required');

  const msg = await Message.create({
    sender: req.user._id,
    receiver: receiverId,
    item: itemId || undefined,
    text
  });

  // Notify receiver if they are offline (using polling, usually websockets, but notification model works here)
  // To avoid spam, maybe we only create a notification if it's the first message or if it's been a while, but for now:
  // await Notification.create({ user: receiverId, type: 'system', message: 'New message from ' + req.user.name, link: '/chat.html' });

  res.status(201).json({ success: true, data: msg });
};

module.exports = { getHistory, getConversations, sendMessage };
