import Stripe from 'stripe';
import { config } from '../../config/env';

export const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2024-06-20',
});

/**
 * Creates a Stripe Checkout session to upgrade/subscribe to a plan
 */
export const createCheckoutSession = async (
  userId: string,
  userEmail: string,
  plan: 'hacker' | 'founder' | 'agency',
  successUrl: string,
  cancelUrl: string
) => {
  const priceId = config.stripe.priceIds[plan];
  
  if (!priceId) {
    throw new Error('Invalid plan selected');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: userEmail,
    client_reference_id: userId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      plan,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
};

/**
 * Validates Stripe Webhook
 */
export const validateWebhookSignature = (payload: string | Buffer, signature: string) => {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    config.stripe.webhookSecret
  );
};
