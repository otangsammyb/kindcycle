const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request' },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, trim: true, maxlength: 1000 },
}, { timestamps: true });

reviewSchema.index({ reviewee: 1 });
reviewSchema.index({ reviewer: 1, item: 1 }, { unique: true }); // one review per transaction

module.exports = mongoose.model('Review', reviewSchema);
