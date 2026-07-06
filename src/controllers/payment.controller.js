const axios = require('axios');
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const Fundraiser = require('../models/Fundraiser');
const notificationService = require('../services/notification.service');
const { createError } = require('../middleware/errorHandler');
const blockchainService = require('../services/blockchain.service');

const CAMPAY_BASE = process.env.CAMPAY_BASE_URL || 'https://demo.campay.net/api';

// Get Campay access token
const getCampayToken = async () => {
  try {
    const res = await axios.post(`${CAMPAY_BASE}/token/`, {
      username: process.env.CAMPAY_USERNAME,
      password: process.env.CAMPAY_PASSWORD,
    });
    return res.data.token;
  } catch (err) {
    console.error('Campay Token Error:', err.response?.data || err.message);
    throw createError('Failed to authenticate with Campay payment provider', 502);
  }
};

// POST /api/payments/initiate
const initiatePayment = async (req, res) => {
  const { amount, phoneNumber, operator, itemId, requestId, fundraiserId, type = 'delivery_fee', description } = req.body;
  if (!amount || !phoneNumber || !operator) {
    throw createError('amount, phoneNumber, and operator are required');
  }
  if (!['mtn', 'orange'].includes(operator)) {
    throw createError('operator must be mtn or orange');
  }
  const validTypes = ['delivery_fee', 'donation', 'fundraiser_contribution'];
  if (!validTypes.includes(type)) throw createError('Invalid payment type');

  // Validate fundraiser exists
  if (type === 'fundraiser_contribution' && fundraiserId) {
    const fundraiser = await Fundraiser.findById(fundraiserId);
    if (!fundraiser || fundraiser.status !== 'active') {
      throw createError('Fundraiser not found or inactive', 404);
    }
  }

  const token = await getCampayToken();
  const externalRef = `KC-${Date.now()}-${req.user._id.toString().slice(-6)}`;

  // Campay requires the 237 country code for Cameroon
  let formattedPhone = String(phoneNumber).replace(/\D/g, '');
  if (!formattedPhone.startsWith('237')) {
    formattedPhone = `237${formattedPhone}`;
  }

  const campayPayload = {
    amount: String(amount),
    currency: 'XAF',
    from: formattedPhone,
    description: description || (type === 'donation' ? 'KindCycle Donation' : type === 'fundraiser_contribution' ? 'KindCycle Fundraiser' : 'KindCycle delivery fee'),
    external_reference: externalRef,
    redirect_url: process.env.CAMPAY_REDIRECT_URL || 'http://localhost:5000/payment.html',
  };

  let campayRes;
  try {
    campayRes = await axios.post(`${CAMPAY_BASE}/collect/`, campayPayload, {
      headers: { Authorization: `Token ${token}` },
    });
  } catch (err) {
    console.error('Campay Collect Error:', err.response?.data || err.message);
    throw createError(err.response?.data?.message || 'Payment initiation failed with provider', 400);
  }

  const transaction = await Transaction.create({
    user: req.user._id,
    item: itemId || null,
    request: requestId || null,
    fundraiser: fundraiserId || null,
    type,
    amount: parseFloat(amount),
    currency: 'XAF',
    operator,
    phoneNumber,
    description: campayPayload.description,
    campayRef: campayRes.data.reference,
    campayExternalRef: externalRef,
    paymentUrl: campayRes.data.ussd_code || null,
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Payment initiated. Approve on your phone.',
    data: {
      transactionId: transaction._id,
      campayRef: campayRes.data.reference,
      ussdCode: campayRes.data.ussd_code,
      operator,
      amount,
      type,
    }
  });
};

// POST /api/payments/webhook — Campay sends updates here
const handleWebhook = async (req, res) => {
  const secret = process.env.CAMPAY_WEBHOOK_SECRET;
  const signature = req.headers['x-campay-signature'] || req.headers['x-signature'];
  const rawBody = req.body;

  if (secret && signature) {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');
    if (signature !== expected && `sha256=${signature}` !== expected) {
      return res.status(401).json({ success: false, error: 'Invalid signature' });
    }
  }

  let payload;
  try {
    payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid JSON body' });
  }

  console.log('[Campay Webhook]', JSON.stringify(payload));

  const { reference, status, amount, operator } = payload;

  const transaction = await Transaction.findOne({ campayRef: reference }).populate('fundraiser');
  if (!transaction) {
    return res.json({ success: true, message: 'Transaction not found, ignoring' });
  }

  const prevStatus = transaction.status;

  const statusMap = {
    SUCCESSFUL: 'successful',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
    PENDING: 'pending',
  };
  transaction.status = statusMap[status] || 'pending';
  transaction.webhookPayload = payload;
  transaction.webhookReceivedAt = new Date();
  await transaction.save();

  if (transaction.status === 'successful') {
    // Blockchain logging hook (non-blocking)
    blockchainService.logTransaction({
      transactionId: transaction._id.toString(),
      amount: transaction.amount,
      currency: transaction.currency,
      operator: transaction.operator,
      reference,
      timestamp: new Date().toISOString(),
    }).catch(() => {});

    if (prevStatus !== 'successful') {
      // Clear public fundraiser caches if anything changed
      await redis.delPattern('cache:fundraisers:*');

      // Notify payer
      await notificationService.send({
        userId: transaction.user.toString(),
        type: 'payment_success',
        title: 'Payment Successful',
        message: `Your payment of ${amount} XAF via ${operator} was successful.`,
        link: '/dashboard-receiver.html',
        metadata: { transactionId: transaction._id },
      });

      // If fundraiser contribution — update fundraiser raised amount + check milestones
      if (transaction.fundraiser) {
        const fundraiser = await Fundraiser.findById(transaction.fundraiser._id || transaction.fundraiser);
        if (fundraiser && fundraiser.status === 'active') {
          fundraiser.raised = (fundraiser.raised || 0) + (transaction.amount || 0);
          fundraiser.donorCount = (fundraiser.donorCount || 0) + 1;

          // Check milestones
          for (const milestone of fundraiser.milestones) {
            if (!milestone.reached && fundraiser.raised >= milestone.amount) {
              milestone.reached = true;
              milestone.reachedAt = new Date();
              // Notify creator
              await notificationService.send({
                userId: fundraiser.creator.toString(),
                type: 'fundraiser_milestone',
                title: 'Milestone reached!',
                message: `Your fundraiser "${fundraiser.title}" hit the "${milestone.title}" milestone of ${milestone.amount.toLocaleString()} XAF!`,
                link: `/fundraisers.html#${fundraiser._id}`,
                metadata: { fundraiserId: fundraiser._id, milestone: milestone.title },
              });
            }
          }

          // Auto-close if goal met
          if (fundraiser.raised >= fundraiser.goalAmount) {
            fundraiser.status = 'completed';
            await notificationService.send({
              userId: fundraiser.creator.toString(),
              type: 'fundraiser_milestone',
              title: 'Fundraiser Goal Reached!',
              message: `Your fundraiser "${fundraiser.title}" has reached its goal of ${fundraiser.goalAmount.toLocaleString()} XAF!`,
              link: `/fundraisers.html#${fundraiser._id}`,
            });
          }

          await fundraiser.save();

          // Notify creator of donation
          await notificationService.send({
            userId: fundraiser.creator.toString(),
            type: 'fundraiser_donation',
            title: 'New donation received',
            message: `Someone donated ${transaction.amount.toLocaleString()} XAF to "${fundraiser.title}".`,
            link: `/fundraisers.html#${fundraiser._id}`,
            metadata: { fundraiserId: fundraiser._id },
          });
        }
      }
    }
  } else if (transaction.status === 'failed') {
    await notificationService.send({
      userId: transaction.user.toString(),
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Your payment of ${amount} XAF via ${operator} failed. Please try again.`,
    });
  }

  res.json({ success: true, message: 'Webhook processed' });
};

// GET /api/payments/status/:ref
const getPaymentStatus = async (req, res) => {
  const transaction = await Transaction.findOne({ campayRef: req.params.ref });
  if (!transaction) throw createError('Transaction not found', 404);
  if (transaction.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw createError('Not authorized', 403);
  }

  // If pending, check directly with Campay (useful for localhost without webhook exposure)
  if (transaction.status === 'pending') {
    try {
      const token = await getCampayToken();
      const campayReq = await axios.get(`${CAMPAY_BASE}/transaction/${transaction.campayRef}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      
      const realStatus = campayReq.data.status;
      if (realStatus === 'SUCCESSFUL' || realStatus === 'FAILED') {
        const statusMap = { SUCCESSFUL: 'successful', FAILED: 'failed' };
        
        // Emulate webhook trigger to process milestones/notifications
        await axios.post(`http://localhost:${process.env.PORT || 5000}/api/payments/webhook`, {
          status: realStatus,
          reference: transaction.campayRef,
          operator: transaction.operator,
          amount: transaction.amount
        }, {
          // Bypass signature check by explicitly forcing it or just update DB here:
          // Since it's easier to just update DB without signature overhead, we'll do the logic:
        }).catch(() => {});

        // Since webhook signature is strict, let's just update the local DB directly if it's successful
        transaction.status = statusMap[realStatus];
        await transaction.save();

        if (transaction.status === 'successful' && transaction.fundraiser) {
          const fundraiser = await Fundraiser.findById(transaction.fundraiser);
          if (fundraiser && fundraiser.status === 'active') {
            fundraiser.raised = (fundraiser.raised || 0) + transaction.amount;
            fundraiser.donorCount = (fundraiser.donorCount || 0) + 1;
            for (const m of fundraiser.milestones) {
              if (!m.reached && fundraiser.raised >= m.amount) m.reached = true;
            }
            if (fundraiser.raised >= fundraiser.goalAmount) fundraiser.status = 'completed';
            await fundraiser.save();
          }
        }
      }
    } catch (e) {
      console.error('Campay status check error:', e.response?.data || e.message);
    }
  }

  res.json({ success: true, data: transaction });
};

// GET /api/payments/my
const getMyTransactions = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const [transactions, total] = await Promise.all([
    Transaction.find({ user: req.user._id }).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit)),
    Transaction.countDocuments({ user: req.user._id }),
  ]);
  res.json({ success: true, data: { transactions, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

module.exports = { initiatePayment, handleWebhook, getPaymentStatus, getMyTransactions, getCampayToken, CAMPAY_BASE };
