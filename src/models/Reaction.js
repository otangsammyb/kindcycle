const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  emoji: { type: String, required: true },
}, { timestamps: true });

reactionSchema.index({ item: 1 });
reactionSchema.index({ user: 1, item: 1 }, { unique: true }); // one reaction per user per item

module.exports = mongoose.model('Reaction', reactionSchema);
