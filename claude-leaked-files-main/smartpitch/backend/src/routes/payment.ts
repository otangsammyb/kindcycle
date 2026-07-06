import express, { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { 
  createStripeSession, 
  stripeWebhook, 
  initiateCamPay, 
  campayWebhook,
  checkCamPayStatus
} from '../controllers/paymentController';

const router = Router();

// Stripe Webhook (MUST be processed before standard body parser middleware in server.ts)
// The raw body parameter is needed for Stripe signature verification
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// CamPay Webhook (Usually handles normal JSON body)
router.post('/campay/webhook', express.json(), campayWebhook);

// Protected routes
router.use(authenticate);

// Stripe Checkout
router.post(
  '/create-checkout-session',
  express.json(),
  [
    body('plan').isIn(['hacker', 'founder', 'agency']).withMessage('Invalid plan selected')
  ],
  createStripeSession
);

// CamPay Request to Pay
router.post(
  '/campay/init',
  express.json(),
  [
    body('plan').isIn(['hacker', 'founder', 'agency']).withMessage('Invalid plan selected'),
    body('phoneNumber').notEmpty().withMessage('Phone number is required'),
    body('provider').isIn(['campay_mtn', 'campay_orange']).withMessage('Invalid provider')
  ],
  initiateCamPay
);

// CamPay Status check
router.get('/campay/status/:reference', checkCamPayStatus);

export default router;
