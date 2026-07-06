const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

// Optimize query for fetching conversation history
messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ receiver: 1, sender: 1 });
messageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
