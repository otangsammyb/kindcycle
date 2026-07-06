require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./src/config/db');
const { connectRedis } = require('./src/config/redis');
const errorHandler = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const itemRoutes = require('./src/routes/item.routes');
const requestRoutes = require('./src/routes/request.routes');
const reviewRoutes = require('./src/routes/review.routes');
const reactionRoutes = require('./src/routes/reaction.routes');
const adminRoutes = require('./src/routes/admin.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const uploadRoutes = require('./src/routes/upload.routes');
const chatRoutes = require('./src/routes/chat.routes');
const ledgerRoutes = require('./src/routes/ledger.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const fundraiserRoutes = require('./src/routes/fundraiser.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (for CloudFront / reverse proxy)
app.set('trust proxy', 1);

// Security & CDN headers
app.use(helmet({
  contentSecurityPolicy: false, // CSP managed by frontend CDN
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Webhook route BEFORE json middleware (needs raw body)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// CDN cache headers for API responses
app.use((req, res, next) => {
  res.set('Vary', 'Accept-Encoding, Authorization');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/fundraisers', fundraiserRoutes);

// Static files
app.use(express.static('client'));

// Handle HTML files without extension
app.get('/:page', (req, res, next) => {
  const options = { root: 'client' };
  res.sendFile(`${req.params.page}.html`, options, (err) => {
    if (err) next();
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Central error handler
app.use(errorHandler);

// Boot
const start = async () => {
  await connectDB();
  await connectRedis();
  app.listen(PORT, () => {
    console.log(`\n🌱 KindCycle API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV}`);
  });
};

start();

module.exports = app;
