const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
  fundraiser: { type: mongoose.Schema.Types.ObjectId, ref: 'Fundraiser', default: null },
  type: {
    type: String,
    enum: ['delivery_fee', 'donation', 'fundraiser_contribution', 'payout'],
    default: 'delivery_fee',
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'XAF' },
  operator: { type: String, enum: ['mtn', 'orange', 'other'], required: true },
  phoneNumber: { type: String, required: true },
  description: { type: String, default: 'KindCycle delivery fee' },

  // Campay fields
  campayRef: { type: String, unique: true, sparse: true },
  campayExternalRef: { type: String },
  paymentUrl: { type: String },

  // Status management
  status: {
    type: String,
    enum: ['initiated', 'pending', 'successful', 'failed', 'cancelled'],
    default: 'initiated'
  },

  // Webhook
  webhookPayload: { type: mongoose.Schema.Types.Mixed },
  webhookReceivedAt: { type: Date },

  // Blockchain hook
  blockchainTxHash: { type: String, default: null },
}, { timestamps: true });

transactionSchema.index({ user: 1 });
transactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
