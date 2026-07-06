const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'item_approved', 'item_rejected', 'request_received',
      'request_accepted', 'request_rejected', 'review_received',
      'id_verified', 'payment_success', 'payment_failed', 'system',
      'new_message', 'fundraiser_milestone', 'fundraiser_donation',
      'account_banned', 'account_unbanned', 'admin_message'
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String, default: null }, // frontend route
  read: { type: Boolean, default: false },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

notificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
