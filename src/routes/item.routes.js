const express = require('express');
const router = express.Router();
const { getItems, getCategories, getItem, createItem, updateItem, deleteItem, getMyItems } = require('../controllers/item.controller');
const { verifyToken, optionalAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { cacheMiddleware } = require('../middleware/cache');
const { uploadItemImages } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

// Public / cached routes
router.get('/categories', cacheMiddleware(300, 'categories'), getCategories);
router.get('/', cacheMiddleware(60, 'items'), optionalAuth, getItems);
router.get('/my', verifyToken, requireRole('giver', 'admin'), getMyItems);
router.get('/:id', optionalAuth, getItem);

// Giver actions
router.post('/', verifyToken, requireRole('giver'), uploadLimiter, uploadItemImages, createItem);
router.patch('/:id', verifyToken, updateItem);
router.delete('/:id', verifyToken, deleteItem);

module.exports = router;
