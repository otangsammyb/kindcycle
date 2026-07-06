const User = require('../models/User');
const Notification = require('../models/Notification');
const { createError } = require('../middleware/errorHandler');
const { delPattern } = require('../config/redis');

// GET /api/users/me
const getMyProfile = async (req, res) => {
  res.json({ success: true, data: req.user.toPublicJSON() });
};

// PATCH /api/users/me
const updateMyProfile = async (req, res) => {
  const allowed = ['name', 'phone', 'bio', 'emailNotifications', 'pushNotifications'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  // Location update
  if (req.body.lat && req.body.lng) {
    updates.location = {
      type: 'Point',
      coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
      city: req.body.city || req.user.location?.city || '',
      country: req.body.country || req.user.location?.country || '',
    };
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, data: user.toPublicJSON() });
};

// PUT /api/users/me/password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw createError('Both current and new password required');
  if (newPassword.length < 8) throw createError('Password must be at least 8 characters');

  const user = await User.findById(req.user._id).select('+password');
  const valid = await user.comparePassword(currentPassword);
  if (!valid) throw createError('Incorrect current password', 401);

  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated successfully' });
};

// POST /api/users/me/id-scan
const uploadIdScan = async (req, res) => {
  if (!req.file) throw createError('No file uploaded');
  await User.findByIdAndUpdate(req.user._id, {
    idScanFileId: req.file.id,
    idScanOriginalName: req.file.originalname,
    idVerified: false,
    idVerificationNote: 'Pending review',
  });
  res.json({ success: true, message: 'ID scan uploaded. Pending admin verification.' });
};

// GET /api/users/:id — public profile
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.params.id).select(
    'name bio avatar role trustScore reviewCount location.city location.country createdAt idVerified'
  );
  if (!user) throw createError('User not found', 404);
  res.json({ success: true, data: user });
};

// GET /api/notifications
const getNotifications = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    Notification.find({ user: req.user._id }).sort('-createdAt').skip(skip).limit(limit),
    Notification.countDocuments({ user: req.user._id }),
  ]);
  const unread = await Notification.countDocuments({ user: req.user._id, read: false });

  res.json({ success: true, data: { notifications, unread, total, page, pages: Math.ceil(total / limit) } });
};

// PATCH /api/notifications/:id/read
const markNotificationRead = async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true }
  );
  res.json({ success: true, message: 'Notification marked as read' });
};

// PATCH /api/notifications/read-all
const markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true, message: 'All notifications marked as read' });
};

// DELETE /api/users/me — deactivate account
const deactivateAccount = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isActive: false, refreshToken: null });
  res.json({ success: true, message: 'Account deactivated' });
};

module.exports = {
  getMyProfile, updateMyProfile, changePassword, uploadIdScan,
  getUserProfile, getNotifications, markNotificationRead, markAllRead, deactivateAccount
};
