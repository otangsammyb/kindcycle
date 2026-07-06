const express = require('express');
const router = express.Router();
const { toggleReaction, getItemReactions } = require('../controllers/reaction.controller');
const { verifyToken, optionalAuth } = require('../middleware/auth');

router.post('/', verifyToken, toggleReaction);
router.get('/:itemId', optionalAuth, getItemReactions);

module.exports = router;
