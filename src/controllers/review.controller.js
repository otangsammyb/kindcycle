const Review = require('../models/Review');
const User = require('../models/User');
const Item = require('../models/Item');
const notificationService = require('../services/notification.service');
const { createError } = require('../middleware/errorHandler');

// POST /api/reviews
// Now supports item-only reviews (requestId optional)
const createReview = async (req, res) => {
  const { revieweeId, itemId, requestId, rating, comment } = req.body;
  if (!revieweeId || !itemId || !rating) {
    throw createError('revieweeId, itemId, and rating are required');
  }

  // Prevent duplicate review per user per item
  const existing = await Review.findOne({ reviewer: req.user._id, item: itemId });
  if (existing) throw createError('You have already reviewed this item', 409);

  const review = await Review.create({
    reviewer: req.user._id,
    reviewee: revieweeId,
    item: itemId,
    request: requestId || null,
    rating: parseInt(rating),
    comment,
  });

  // Update reviewee trust score (rolling average)
  const reviews = await Review.find({ reviewee: revieweeId });
  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  await User.findByIdAndUpdate(revieweeId, {
    trustScore: Math.round(avgRating * 20),
    reviewCount: reviews.length,
  });

  // Real-time notification to reviewee
  await notificationService.send({
    userId: revieweeId,
    type: 'review_received',
    title: 'New review received',
    message: `${req.user.name} left you a ${rating}-star review.`,
    link: `/item.html?id=${itemId}`,
    metadata: { reviewId: review._id, itemId },
  });

  const populated = await review.populate('reviewer', 'name avatar');
  res.status(201).json({ success: true, data: populated });
};

// GET /api/reviews/user/:userId — reviews for a giver profile
const getUserReviews = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const [reviews, total] = await Promise.all([
    Review.find({ reviewee: req.params.userId })
      .sort('-createdAt')
      .populate('reviewer', 'name avatar')
      .populate('item', 'title')
      .skip((page - 1) * limit).limit(parseInt(limit)),
    Review.countDocuments({ reviewee: req.params.userId }),
  ]);
  res.json({ success: true, data: { reviews, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

// GET /api/reviews/item/:itemId — reviews for a specific item listing
const getItemReviews = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const [reviews, total, avgArr] = await Promise.all([
    Review.find({ item: req.params.itemId })
      .sort('-createdAt')
      .populate('reviewer', 'name avatar')
      .skip((page - 1) * limit).limit(parseInt(limit)),
    Review.countDocuments({ item: req.params.itemId }),
    Review.aggregate([
      { $match: { item: require('mongoose').Types.ObjectId.createFromHexString(req.params.itemId) } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),
  ]);
  const avg = avgArr[0]?.avg || 0;
  res.json({ success: true, data: { reviews, total, averageRating: Math.round(avg * 10) / 10, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

// GET /api/reviews/mine/for-item/:itemId — check if current user already reviewed
const getMyReviewForItem = async (req, res) => {
  const review = await Review.findOne({ reviewer: req.user._id, item: req.params.itemId });
  res.json({ success: true, data: review });
};

// DELETE /api/reviews/:id (admin only)
const deleteReview = async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Review deleted' });
};

module.exports = { createReview, getUserReviews, getItemReviews, getMyReviewForItem, deleteReview };
