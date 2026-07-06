const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createError } = require('../middleware/errorHandler');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { accessToken, refreshToken };
};

// POST /api/auth/register
const register = async (req, res) => {
  const { name, email, password, phone, role } = req.body;

  if (!name || !email || !password) throw createError('Name, email and password are required');
  if (!['giver', 'receiver'].includes(role)) throw createError('Role must be giver or receiver');

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw createError('Email already registered', 409);

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role,
    idScanFileId: req.file ? req.file.gridfs.id : null,
    idScanOriginalName: req.file ? req.file.originalname : null,
  });

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: user.toPublicJSON(),
      accessToken,
      refreshToken,
    }
  });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw createError('Email and password are required');

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
  if (!user) throw createError('Invalid credentials', 401);
  if (user.isBanned) throw createError(`Account banned: ${user.banReason}`, 403);
  if (!user.isActive) throw createError('Account deactivated', 403);

  const valid = await user.comparePassword(password);
  if (!valid) throw createError('Invalid credentials', 401);

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshToken = refreshToken;
  await user.save();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toPublicJSON(),
      accessToken,
      refreshToken,
    }
  });
};

// POST /api/auth/refresh
const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw createError('Refresh token required');

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw createError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) {
    throw createError('Refresh token revoked', 401);
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
  user.refreshToken = newRefreshToken;
  await user.save();

  res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
};

// POST /api/auth/logout
const logout = async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  }
  res.json({ success: true, message: 'Logged out successfully' });
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, data: req.user.toPublicJSON() });
};

module.exports = { register, login, refresh, logout, getMe };
