const mongoose = require('mongoose');

const CATEGORIES = [
  'Clothing', 'Electronics', 'Furniture', 'Books', 'Food',
  'Toys', 'Sports', 'Medical', 'School Supplies', 'Household',
  'Baby & Kids', 'Tools', 'Other'
];

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  category: { type: String, required: true, enum: CATEGORIES },
  condition: { type: String, enum: ['new', 'like_new', 'good', 'fair', 'poor'], default: 'good' },

  // Media
  images: [{ fileId: mongoose.Schema.Types.ObjectId, url: String }], // GridFS refs

  // Giver
  giver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Location
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    city: { type: String, default: '' },
    country: { type: String, default: '' },
  },

  // Delivery
  deliveryMethod: {
    type: String,
    enum: ['pickup', 'delivery', 'both'],
    default: 'pickup'
  },
  deliveryNotes: { type: String, default: '' },

  // Status workflow: pending -> approved -> reserved -> given | rejected
  status: {
    type: String,
    enum: ['pending', 'approved', 'reserved', 'given', 'rejected'],
    default: 'pending'
  },
  adminNote: { type: String, default: '' },
  approvedAt: { type: Date, default: null },
  givenAt: { type: Date, default: null },

  // Stats
  viewCount: { type: Number, default: 0 },
  requestCount: { type: Number, default: 0 },
  reactionCount: { type: Number, default: 0 },

  // Advanced hooks
  aiMatchScore: { type: Number, default: null }, // AI matching hook
  blockchainTxHash: { type: String, default: null }, // Blockchain logging hook
  arDataUri: { type: String, default: null }, // AR visualization hook

  // Tags for search
  tags: [{ type: String }],
}, { timestamps: true });

// Geospatial index for $near queries
itemSchema.index({ location: '2dsphere' });
itemSchema.index({ category: 1, status: 1 });
itemSchema.index({ giver: 1 });
itemSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Item', itemSchema);
module.exports.CATEGORIES = CATEGORIES;
