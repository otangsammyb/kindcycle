import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createCheckoutSession, validateWebhookSignature } from '../services/payment/stripe';
import { requestToPay, getTransactionStatus } from '../services/payment/campay';
import { Payment } from '../models/Payment';
import { User, SubscriptionPlan } from '../models/User';
import { Config } from '../models/Config';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';
import { config } from '../config/env';

// ===== STRIPE CONTROLLERS =====

export const createStripeSession = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { plan } = req.body;

    // Check if Stripe is enabled
    const stripeEnabledConf = await Config.findOne({ key: 'STRIPE_ENABLED' });
    if (stripeEnabledConf && stripeEnabledConf.value === false) {
      return next(new AppError('Card payments are currently disabled', 400));
    }

    const user = await User.findById(req.user!.id);

    if (!user) return next(new AppError('User not found', 404));

    const successUrl = `${config.frontendUrl}/dashboard/billing?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${config.frontendUrl}/dashboard/billing?canceled=true`;

    const session = await createCheckoutSession(
      user._id.toString(),
      user.email,
      plan as 'hacker' | 'founder' | 'agency',
      successUrl,
      cancelUrl
    );

    // Record pending payment
    const priceId = config.stripe.priceIds[plan as keyof typeof config.stripe.priceIds];
    const priceConf = await Config.findOne({ key: 'PLAN_PRICES' });
    const amount = priceConf?.value[plan] || config.plans[plan as keyof typeof config.plans].price;

    await Payment.create({
      userId: user._id,
      amount,
      currency: 'USD',
      method: 'stripe',
      status: 'pending',
      plan,
      stripeSessionId: session.id,
      description: `Subscription to ${plan} plan via Stripe`,
    });

    res.status(200).json({ status: 'success', data: { url: session.url } });
  } catch (err) {
    next(err);
  }
};

export const stripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  let event;

  try {
    event = validateWebhookSignature(req.body, signature);
  } catch (err: any) {
    logger.error('Stripe webhook signature verification failed', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.metadata.userId;
        const plan = session.metadata.plan;

        const payment = await Payment.findOne({ stripeSessionId: session.id });
        if (payment) {
          payment.status = 'completed';
          await payment.save();
        }

        const user = await User.findById(userId);
        if (user) {
          user.plan = plan as SubscriptionPlan;
          user.stripeCustomerId = session.customer;
          user.stripeSubscriptionId = session.subscription;
          await user.save();
          logger.info(`User ${user.email} successfully upgraded to ${plan} via Stripe`);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const user = await User.findOne({ stripeSubscriptionId: subscription.id });
        
        if (user) {
          user.plan = 'free';
          user.stripeSubscriptionId = undefined;
          await user.save();
          logger.info(`User ${user.email} subscription canceled/deleted via Stripe`);
        }
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error('Error processing Stripe webhook', err);
    res.status(500).json({ status: 'error' });
  }
};

// ===== CAMPAY CONTROLLERS =====

export const initiateCamPay = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { plan, phoneNumber, provider } = req.body; // provider = campay_mtn | campay_orange

    // Check if CamPay is enabled
    const campayEnabledConf = await Config.findOne({ key: 'CAMPAY_ENABLED' });
    if (campayEnabledConf && campayEnabledConf.value === false) {
      return next(new AppError('Mobile money payments are currently disabled', 400));
    }

    const user = await User.findById(req.user!.id);

    if (!user) return next(new AppError('User not found', 404));

    // Fetch dynamic prices
    const priceConf = await Config.findOne({ key: 'PLAN_PRICES' });
    const amountUSD = priceConf?.value[plan] || config.plans[plan as keyof typeof config.plans].price;
    
    // Convert price to XAF (approx 600 XAF = 1 USD for demo purposes)
    const amountXAF = amountUSD * 600; 
    
    // Create record
    const payment = await Payment.create({
      userId: user._id,
      amount: amountXAF,
      currency: 'XAF',
      method: provider,
      status: 'pending',
      plan,
      description: `Subscription to ${plan} plan via CamPay`,
    });

    // Fire API request to CamPay
    const campayRes = await requestToPay(
      phoneNumber,
      amountXAF,
      'XAF',
      payment._id.toString(),
      payment.description
    );

    payment.campayReference = campayRes.reference;
    await payment.save();

    res.status(200).json({ 
      status: 'success', 
      data: { 
        message: 'Payment initiated. Please check your phone to confirm.',
        reference: campayRes.reference
      } 
    });

  } catch (err) {
    next(err);
  }
};

export const campayWebhook = async (req: Request, res: Response) => {
  try {
    const { reference, status, external_reference, transaction_id } = req.body;
    logger.info(`CamPay Webhook received: ${reference} - ${status}`);

    const payment = await Payment.findById(external_reference);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (status === 'SUCCESSFUL') {
      payment.status = 'completed';
      payment.campayTransactionId = transaction_id;
      await payment.save();

      const user = await User.findById(payment.userId);
      if (user) {
        user.plan = payment.plan as SubscriptionPlan;
        user.campayReference = reference;
        await user.save();
        logger.info(`User ${user.email} successfully upgraded to ${payment.plan} via CamPay`);
      }
    } else if (status === 'FAILED') {
      payment.status = 'failed';
      await payment.save();
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error processing CamPay webhook', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

export const checkCamPayStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { reference } = req.params;
    const payment = await Payment.findOne({ campayReference: reference });
    
    if (!payment) return next(new AppError('Payment not found', 404));

    const statusRes = await getTransactionStatus(reference);
    
    if (statusRes.status === 'SUCCESSFUL' && payment.status !== 'completed') {
      payment.status = 'completed';
      payment.campayTransactionId = statusRes.transaction_id;
      await payment.save();

      const user = await User.findById(payment.userId);
      if (user) {
        user.plan = payment.plan as SubscriptionPlan;
        user.campayReference = reference;
        await user.save();
      }
    }

    res.status(200).json({ 
      status: 'success', 
      data: { 
        status: statusRes.status,
        plan: payment.plan
      } 
    });
  } catch (err) {
    next(err);
  }
};
