const User = require('../models/User');
const Item = require('../models/Item');
const Request = require('../models/Request');
const Transaction = require('../models/Transaction');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const Fundraiser = require('../models/Fundraiser');
const notificationService = require('../services/notification.service');
const { createError } = require('../middleware/errorHandler');
const { delPattern } = require('../config/redis');

// GET /api/admin/stats
const getStats = async (req, res) => {
  const [
    totalUsers, givers, receivers,
    totalItems, pendingItems, approvedItems, givenItems,
    totalRequests, totalTransactions, totalRevenueArr,
    activeFundraisers, totalFundraisedArr,
    unreadNotifications,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'giver' }),
    User.countDocuments({ role: 'receiver' }),
    Item.countDocuments(),
    Item.countDocuments({ status: 'pending' }),
    Item.countDocuments({ status: 'approved' }),
    Item.countDocuments({ status: 'given' }),
    Request.countDocuments(),
    Transaction.countDocuments({ status: 'successful' }),
    Transaction.aggregate([{ $match: { status: 'successful' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Fundraiser.countDocuments({ status: 'active' }),
    Fundraiser.aggregate([{ $group: { _id: null, total: { $sum: '$raised' } } }]),
    Notification.countDocuments({ read: false }),
  ]);

  res.json({
    success: true,
    data: {
      users: { total: totalUsers, givers, receivers },
      items: { total: totalItems, pending: pendingItems, approved: approvedItems, given: givenItems },
      requests: totalRequests,
      transactions: { count: totalTransactions, revenue: totalRevenueArr[0]?.total || 0 },
      fundraisers: { active: activeFundraisers, totalRaised: totalFundraisedArr[0]?.total || 0 },
      unreadNotifications,
    }
  });
};

// GET /api/admin/stats/detailed
const getDetailedStats = async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    donationsByDay,
    itemsByCategory,
    topGivers,
    topReceivers,
    recentTransactions,
    pendingVerifications,
  ] = await Promise.all([
    Transaction.aggregate([
      { $match: { status: 'successful', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Item.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    User.find({ role: 'giver' }).sort('-trustScore').limit(5).select('name avatar trustScore reviewCount'),
    User.find({ role: 'receiver' }).sort('-createdAt').limit(5).select('name avatar createdAt'),
    Transaction.find({ status: 'successful' }).sort('-createdAt').limit(10).populate('user', 'name email'),
    User.countDocuments({ idScanFileId: { $ne: null }, idVerified: false }),
  ]);

  res.json({
    success: true,
    data: { donationsByDay, itemsByCategory, topGivers, topReceivers, recentTransactions, pendingVerifications },
  });
};

// GET /api/admin/pending-items
const getPendingItems = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const [items, total] = await Promise.all([
    Item.find({ status: 'pending' }).sort('-createdAt')
      .populate('giver', 'name email idVerified trustScore')
      .skip((page - 1) * limit).limit(parseInt(limit)),
    Item.countDocuments({ status: 'pending' }),
  ]);
  res.json({ success: true, data: { items, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

// PATCH /api/admin/items/:id/approve
const approveItem = async (req, res) => {
  const item = await Item.findById(req.params.id).populate('giver', 'name');
  if (!item) throw createError('Item not found', 404);

  item.status = 'approved';
  item.approvedAt = new Date();
  item.adminNote = req.body.note || '';
  await item.save();
  await delPattern('cache:/api/items*');

  await notificationService.send({
    userId: item.giver._id.toString(),
    type: 'item_approved',
    title: 'Your item was approved!',
    message: `"${item.title}" is now visible to the community.`,
    link: `/item.html?id=${item._id}`,
  });

  res.json({ success: true, message: 'Item approved', data: item });
};

// PATCH /api/admin/items/:id/reject
const rejectItem = async (req, res) => {
  const item = await Item.findById(req.params.id).populate('giver');
  if (!item) throw createError('Item not found', 404);

  item.status = 'rejected';
  item.adminNote = req.body.reason || 'Does not meet community guidelines';
  await item.save();

  await notificationService.send({
    userId: item.giver._id.toString(),
    type: 'item_rejected',
    title: 'Item not approved',
    message: `"${item.title}" was not approved. Reason: ${item.adminNote}`,
    link: `/dashboard-giver.html`,
  });

  res.json({ success: true, message: 'Item rejected', data: item });
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  const { role, verified, banned, page = 1, limit = 20, search } = req.query;
  const query = {};
  if (role) query.role = role;
  if (verified !== undefined) query.idVerified = verified === 'true';
  if (banned !== undefined) query.isBanned = banned === 'true';
  if (search) query.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const [users, total] = await Promise.all([
    User.find(query).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit))
      .select('-password -refreshToken'),
    User.countDocuments(query),
  ]);
  res.json({ success: true, data: { users, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

// GET /api/admin/pending-verifications
const getPendingVerifications = async (req, res) => {
  const users = await User.find({ idScanFileId: { $ne: null }, idVerified: false, isBanned: false })
    .select('name email role idScanFileId idScanOriginalName createdAt')
    .sort('-createdAt').limit(50);
  res.json({ success: true, data: users });
};

// PATCH /api/admin/users/:id/verify
const verifyUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, {
    idVerified: true,
    idVerificationNote: 'Verified by admin',
  }, { new: true });
  if (!user) throw createError('User not found', 404);

  await notificationService.send({
    userId: user._id.toString(),
    type: 'id_verified',
    title: 'Identity Verified',
    message: 'Your ID has been verified. You now have full platform access.',
  });

  res.json({ success: true, message: 'User verified', data: user.toPublicJSON() });
};

// PATCH /api/admin/users/:id/ban
const banUser = async (req, res) => {
  const { banned = true, reason = '' } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, {
    isBanned: banned,
    banReason: banned ? reason : '',
  }, { new: true });
  if (!user) throw createError('User not found', 404);

  await notificationService.send({
    userId: user._id.toString(),
    type: banned ? 'account_banned' : 'account_unbanned',
    title: banned ? 'Account Suspended' : 'Account Reinstated',
    message: banned
      ? `Your account has been suspended. Reason: ${reason || 'Violation of community guidelines.'}`
      : 'Your account suspension has been lifted. Welcome back!',
  });

  res.json({ success: true, message: banned ? 'User banned' : 'User unbanned', data: user.toPublicJSON() });
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw createError('User not found', 404);
  res.json({ success: true, message: 'User deleted' });
};

// GET /api/admin/fundraisers
const getFundraisers = async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = status ? { status } : {};
  const [fundraisers, total] = await Promise.all([
    Fundraiser.find(query).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit))
      .populate('creator', 'name email'),
    Fundraiser.countDocuments(query),
  ]);
  res.json({ success: true, data: { fundraisers, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

// PATCH /api/admin/fundraisers/:id/close
const closeFundraiserAdmin = async (req, res) => {
  const fundraiser = await Fundraiser.findByIdAndUpdate(req.params.id, { status: 'closed', adminNote: req.body.reason || '' }, { new: true });
  if (!fundraiser) throw createError('Fundraiser not found', 404);
  res.json({ success: true, message: 'Fundraiser closed by admin', data: fundraiser });
};

// POST /api/admin/notify-user — send custom notification to a user or broadcast
const notifyUser = async (req, res) => {
  const { userId, title, message, link, broadcast } = req.body;
  if (!title || !message) throw createError('title and message are required');

  if (broadcast) {
    const users = await User.find({ isActive: true }).select('_id');
    const promises = users.map(u => notificationService.send({
      userId: u._id.toString(), type: 'admin_message', title, message, link,
    }).catch(() => {}));
    await Promise.all(promises);
    return res.json({ success: true, message: `Broadcast sent to ${users.length} users` });
  }

  if (!userId) throw createError('userId required (or set broadcast:true)');
  const user = await User.findById(userId);
  if (!user) throw createError('User not found', 404);

  await notificationService.send({ userId, type: 'admin_message', title, message, link });
  res.json({ success: true, message: 'Notification sent' });
};

// GET /api/admin/transactions
const getTransactions = async (req, res) => {
  const { page = 1, limit = 20, status, type } = req.query;
  const query = {};
  if (status) query.status = status;
  if (type) query.type = type;
  const [transactions, total] = await Promise.all([
    Transaction.find(query).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit))
      .populate('user', 'name email'),
    Transaction.countDocuments(query),
  ]);
  res.json({ success: true, data: { transactions, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

module.exports = {
  getStats, getDetailedStats, getPendingItems, approveItem, rejectItem,
  getUsers, getPendingVerifications, verifyUser, banUser, deleteUser,
  getFundraisers, closeFundraiserAdmin, notifyUser, getTransactions,
};
