const express = require('express');
const router = express.Router();
const { createReview, getUserReviews, getItemReviews, getMyReviewForItem, deleteReview } = require('../controllers/review.controller');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// Any authenticated user (receiver) can post a review
router.post('/', verifyToken, createReview);
// Get reviews by giver user
router.get('/user/:userId', getUserReviews);
// Get reviews for a specific item listing
router.get('/item/:itemId', getItemReviews);
// Check if current user already reviewed this item
router.get('/mine/for-item/:itemId', verifyToken, getMyReviewForItem);
// Admin delete
router.delete('/:id', verifyToken, requireRole('admin'), deleteReview);

module.exports = router;
