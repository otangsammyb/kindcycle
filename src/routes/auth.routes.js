const express = require('express');
const router = express.Router();
const { register, login, refresh, logout, getMe } = require('../controllers/auth.controller');
const { verifyToken } = require('../middleware/auth');
const { uploadIdScan } = require('../middleware/upload');
const { authLimiter } = require('../middleware/rateLimiter');

// @route   POST /api/auth/register
// @desc    Register new user with optional ID scan upload
// @access  Public
router.post('/register', authLimiter, uploadIdScan, register);

// @route   POST /api/auth/login
// @desc    Login and get JWT tokens
// @access  Public
router.post('/login', authLimiter, login);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public (with refresh token)
router.post('/refresh', refresh);

// @route   POST /api/auth/logout
// @desc    Logout and revoke refresh token
// @access  Protected
router.post('/logout', verifyToken, logout);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Protected
router.get('/me', verifyToken, getMe);

module.exports = router;
