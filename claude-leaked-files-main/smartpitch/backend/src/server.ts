import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config } from './config/env';
import { connectDB } from './config/db';
import logger from './utils/logger';
import { AppError } from './utils/AppError';

import authRoutes from './routes/auth';
import analysisRoutes from './routes/analysis';
import exportRoutes from './routes/export';
import paymentRoutes from './routes/payment';
import adminRoutes from './routes/admin';
import { seedAdmin } from './utils/seedAdmin';

const app: Express = express();

// Database Connection
connectDB().then(() => {
  seedAdmin();
});

// Global Middlewares
app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(compression());
app.use(morgan('dev', { stream: { write: (message) => logger.info(message.trim()) } }));

// Rate Limiting (Standard limit for APIs)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', apiLimiter);

// Webhook parsing - must be before express.json() for Stripe
// app.use('/api/payment/stripe/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Undefined Route Handler
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (config.env === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    // Production Error Response
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      logger.error('ERROR 💥', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
      });
    }
  }
});

app.listen(config.port, () => {
  logger.info(`🚀 SmartPitch Backend running on port ${config.port} in ${config.env} mode`);
});
