const express = require('express');
const router = express.Router();
const { getHistory, getConversations, sendMessage } = require('../controllers/chat.controller');
const { verifyToken } = require('../middleware/auth');

router.get('/conversations', verifyToken, getConversations);
router.get('/history/:userId', verifyToken, getHistory);
router.post('/', verifyToken, sendMessage);

module.exports = router;
