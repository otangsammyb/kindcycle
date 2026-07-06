const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  giver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  justification: { type: String, required: true, trim: true, maxlength: 1000 },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  giverNote: { type: String, default: '' },
  preferredDelivery: { type: String, enum: ['pickup', 'delivery'], default: 'pickup' },
  meetingAddress: { type: String, default: '' },
  meetingDate: { type: Date, default: null },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

requestSchema.index({ item: 1, receiver: 1 }, { unique: true }); // one request per user per item
requestSchema.index({ giver: 1, status: 1 });
requestSchema.index({ receiver: 1, status: 1 });

module.exports = mongoose.model('Request', requestSchema);
