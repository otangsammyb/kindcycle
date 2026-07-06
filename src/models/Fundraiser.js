const mongoose = require('mongoose');

const FUNDRAISER_CATEGORIES = [
  'Medical', 'Education', 'Food & Water', 'Housing', 'Emergency',
  'Community', 'Environment', 'Youth', 'Elderly', 'Other'
];

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 1 }, // threshold in XAF
  reached: { type: Boolean, default: false },
  reachedAt: { type: Date, default: null },
}, { _id: false });

const fundraiserSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 3000 },
  category: { type: String, required: true, enum: FUNDRAISER_CATEGORIES },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Financials
  goalAmount: { type: Number, required: true, min: 1 },
  raised: { type: Number, default: 0 },
  withdrawn: { type: Number, default: 0 },
  currency: { type: String, default: 'XAF' },
  donorCount: { type: Number, default: 0 },

  // Media
  images: [{ fileId: mongoose.Schema.Types.ObjectId, url: String }],
  coverImage: { type: String, default: null }, // URL or base64 for quick display

  // Milestone progression
  milestones: [milestoneSchema],

  // Status
  deadline: { type: Date, default: null },
  status: {
    type: String,
    enum: ['active', 'completed', 'closed'],
    default: 'active',
  },
  adminNote: { type: String, default: '' },
}, { timestamps: true });

fundraiserSchema.index({ creator: 1 });
fundraiserSchema.index({ status: 1, createdAt: -1 }); // cover index for default listing query
fundraiserSchema.index({ status: 1, category: 1, createdAt: -1 }); // cover index for filtered queries
fundraiserSchema.index({ title: 'text', description: 'text' });

// Virtual: progress %
fundraiserSchema.virtual('progress').get(function () {
  if (!this.goalAmount) return 0;
  return Math.min(100, Math.round((this.raised / this.goalAmount) * 100));
});

fundraiserSchema.set('toJSON', { virtuals: true });
fundraiserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Fundraiser', fundraiserSchema);
module.exports.FUNDRAISER_CATEGORIES = FUNDRAISER_CATEGORIES;
