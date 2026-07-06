const Fundraiser = require('../models/Fundraiser');
const Transaction = require('../models/Transaction');
const { createError } = require('../middleware/errorHandler');
const redis = require('../config/redis');
const axios = require('axios');
const { getCampayToken, CAMPAY_BASE } = require('./payment.controller');

// POST /api/fundraisers
const createFundraiser = async (req, res) => {
  const { title, description, category, goalAmount, deadline, milestones, coverImage } = req.body;
  if (!title || !description || !category || !goalAmount) {
    throw createError('title, description, category, and goalAmount are required');
  }

  let parsedMilestones = [];
  if (milestones) {
    try {
      parsedMilestones = typeof milestones === 'string' ? JSON.parse(milestones) : milestones;
    } catch { parsedMilestones = []; }
  }

  const fundraiser = await Fundraiser.create({
    title,
    description,
    category,
    creator: req.user._id,
    goalAmount: parseFloat(goalAmount),
    deadline: deadline ? new Date(deadline) : null,
    milestones: parsedMilestones.map(m => ({ title: m.title, amount: parseFloat(m.amount) })),
    coverImage: coverImage || null,
  });

  await redis.delPattern('cache:fundraisers:*');
  res.status(201).json({ success: true, data: fundraiser });
};

// GET /api/fundraisers
const listFundraisers = async (req, res) => {
  const { page = 1, limit = 12, category, status = 'active', search } = req.query;

  const cacheKey = `cache:fundraisers:${status}:${category||'all'}:${page}:${limit}:${search||''}`;
  const staleCacheKey = `${cacheKey}:stale`;

  // ── Stale-While-Revalidate ──────────────────────────────
  // Serve immediately from cache (even if slightly stale), then refresh in background
  const cached = await redis.get(cacheKey);
  if (cached) {
    res.set('X-Cache', 'HIT');
    res.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=60');
    res.json(cached);

    // Background revalidation: only if the SWR marker expired
    const needsRefresh = !(await redis.get(staleCacheKey));
    if (needsRefresh) {
      redis.set(staleCacheKey, '1', 15); // lock for 15s to prevent thundering herd
      setImmediate(async () => {
        try {
          const fresh = await _fetchFundraisers({ status, category, search, page, limit });
          await redis.set(cacheKey, fresh, 120);
        } catch { /* non-fatal */ }
      });
    }
    return;
  }

  // Cold cache miss — fetch from DB and cache
  const payload = await _fetchFundraisers({ status, category, search, page, limit });
  await redis.set(cacheKey, payload, 120); // 2 min TTL
  res.set('X-Cache', 'MISS');
  res.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=60');
  res.json(payload);
};

// Internal helper: fetch fundraisers from DB with lean + projection
const _fetchFundraisers = async ({ status, category, search, page = 1, limit = 12 }) => {
  const query = { status };
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const [fundraisers, total] = await Promise.all([
    Fundraiser.find(query)
      .select('title category creator coverImage goalAmount raised withdrawn donorCount milestones deadline status createdAt') // exclude heavy fields
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('creator', 'name avatar trustScore')
      .lean(), // skip Mongoose hydration — ~40% faster serialization
    Fundraiser.countDocuments(query),
  ]);

  // Recompute `progress` virtual manually (lean() disables virtuals)
  fundraisers.forEach(f => {
    f.progress = f.goalAmount ? Math.min(100, Math.round((f.raised / f.goalAmount) * 100)) : 0;
  });

  return { success: true, data: { fundraisers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } };
};

// GET /api/fundraisers/:id
const getFundraiser = async (req, res) => {
  const fundraiser = await Fundraiser.findById(req.params.id)
    .populate('creator', 'name avatar bio trustScore reviewCount location');
  if (!fundraiser) throw createError('Fundraiser not found', 404);
  res.json({ success: true, data: fundraiser });
};

// GET /api/fundraisers/my
const listMyFundraisers = async (req, res) => {
  const fundraisers = await Fundraiser.find({ creator: req.user._id }).sort('-createdAt');
  res.json({ success: true, data: { fundraisers, total: fundraisers.length } });
};

// PATCH /api/fundraisers/:id/close
const closeFundraiser = async (req, res) => {
  const fundraiser = await Fundraiser.findById(req.params.id);
  if (!fundraiser) throw createError('Fundraiser not found', 404);

  const isOwner = fundraiser.creator.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') throw createError('Not authorized', 403);

  fundraiser.status = 'closed';
  await fundraiser.save();
  await redis.delPattern('cache:fundraisers:*');
  res.json({ success: true, message: 'Fundraiser closed', data: fundraiser });
};

// DELETE /api/fundraisers/:id
const deleteFundraiser = async (req, res) => {
  const fundraiser = await Fundraiser.findById(req.params.id);
  if (!fundraiser) throw createError('Fundraiser not found', 404);

  const isOwner = fundraiser.creator.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') throw createError('Not authorized', 403);

  await fundraiser.deleteOne();
  await redis.delPattern('cache:fundraisers:*');
  res.json({ success: true, message: 'Fundraiser deleted' });
};

// GET /api/admin/fundraisers  (used by admin controller but returned here for reuse)
const getAdminFundraisers = async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = status ? { status } : {};
  const [fundraisers, total] = await Promise.all([
    Fundraiser.find(query).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit))
      .populate('creator', 'name email'),
    Fundraiser.countDocuments(query),
  ]);
  res.json({ success: true, data: { fundraisers, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

// PATCH /api/fundraisers/:id  — update status or other fields
const updateFundraiser = async (req, res) => {
  const fundraiser = await Fundraiser.findById(req.params.id);
  if (!fundraiser) throw createError('Fundraiser not found', 404);
  const isOwner = fundraiser.creator.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') throw createError('Not authorized', 403);
  const allowed = ['status', 'title', 'description', 'goalAmount', 'deadline'];
  allowed.forEach(f => { if (req.body[f] !== undefined) fundraiser[f] = req.body[f]; });
  await fundraiser.save();
  await redis.delPattern('cache:fundraisers:*');
  res.json({ success: true, data: fundraiser });
};

// POST /api/fundraisers/:id/withdraw  — creator requests a payout
const requestWithdrawal = async (req, res) => {
  const { phoneNumber, amount: requestedAmount } = req.body;
  if (!phoneNumber) throw createError('phoneNumber is required', 400);

  const fundraiser = await Fundraiser.findById(req.params.id).populate('creator', 'name email');
  if (!fundraiser) throw createError('Fundraiser not found', 404);

  const creatorId = (fundraiser.creator?._id || fundraiser.creator)?.toString();
  const userId = (req.user?._id || req.user?.id)?.toString();
  if (creatorId !== userId) throw createError('Not authorized', 403);
  if (fundraiser.status !== 'active') throw createError('Can only withdraw from active fundraisers', 400);

  const totalRaised = fundraiser.raised || 0;
  const totalWithdrawn = fundraiser.withdrawn || 0;
  const availableBalance = totalRaised - totalWithdrawn;

  if (availableBalance <= 0) throw createError('No available funds for withdrawal', 400);

  // Use user-requested amount (or full balance if not specified)
  const grossAmount = requestedAmount ? Number(requestedAmount) : availableBalance;
  if (isNaN(grossAmount) || grossAmount <= 0) throw createError('Invalid withdrawal amount', 400);
  if (grossAmount > availableBalance) throw createError(`Amount exceeds available balance of ${availableBalance.toLocaleString()} XAF`, 400);

  const fee = Math.floor(grossAmount * 0.029);
  const net = grossAmount - fee;

  // Ensure Cameroon country code
  let formattedPhone = String(phoneNumber).replace(/\D/g, '');
  if (!formattedPhone.startsWith('237')) formattedPhone = `237${formattedPhone}`;

  // Detect operator for the transaction record
  const p2 = formattedPhone.replace('237', '').substring(0, 2);
  const p3 = formattedPhone.replace('237', '').substring(0, 3);
  const mtnPrefixes2 = ['67'];
  const mtnPrefixes3 = ['650','651','652','653','654','680','681','682','683'];
  const orangePrefixes2 = ['69'];
  const detectedOperator = (mtnPrefixes2.includes(p2) || mtnPrefixes3.includes(p3))
    ? 'mtn'
    : (orangePrefixes2.includes(p2) ? 'orange' : 'other');

  // Talk to Campay
  let campayRef = `LOCAL-${Date.now()}`;
  if (process.env.NODE_ENV !== 'test') {
    try {
      const token = await getCampayToken();
      const payload = {
        amount: String(net),
        currency: 'XAF',
        to: formattedPhone,
        description: `KindCycle Withdrawal: ${fundraiser.title}`,
        external_reference: `WD-${Date.now()}-${fundraiser._id.toString().slice(-6)}`
      };
      const payoutRes = await axios.post(`${CAMPAY_BASE}/withdraw/`, payload, {
        headers: { Authorization: `Token ${token}` },
      });
      campayRef = payoutRes.data.reference;
    } catch (err) {
      console.error('[Campay Withdrawal Error]', err.response?.data || err.message);
      const campayMsg = err.response?.data?.message || err.response?.statusText || err.message;
      if (err.response?.status === 401 || campayMsg?.toLowerCase().includes('unauthorized')) {
        throw createError('Campay Error: Your Campay application lacks withdrawal permissions. Enable "Withdrawals" in your Campay Dashboard.', 403);
      }
      throw createError(`Campay Error: ${campayMsg}`, 502);
    }
  }

  // Record the payout as a Transaction for history
  await Transaction.create({
    user: req.user._id,
    fundraiser: fundraiser._id,
    type: 'payout',
    amount: net,
    currency: 'XAF',
    operator: detectedOperator,
    phoneNumber: formattedPhone,
    description: `Withdrawal payout from "${fundraiser.title}" (2.9% fee: ${fee} XAF)`,
    campayRef,
    status: 'successful',
  });

  // Increment withdrawn to reflect amount taken (preserves milestone progress)
  fundraiser.withdrawn = (fundraiser.withdrawn || 0) + grossAmount;
  await fundraiser.save();
  await redis.delPattern('cache:fundraisers:*');

  console.log(`[API WITHDRAWAL] ${net} XAF → ${formattedPhone} via Campay (Ref: ${campayRef}). Fee: ${fee} XAF.`);

  res.json({
    success: true,
    message: `Withdrawal of ${net.toLocaleString()} XAF dispatched to ${phoneNumber}. Platform fee: ${fee.toLocaleString()} XAF.`,
    net, fee, grossAmount, campayRef,
  });
};

// GET /api/fundraisers/:id/transactions — creator views payout history
const getFundraiserTransactions = async (req, res) => {
  const fundraiser = await Fundraiser.findById(req.params.id);
  if (!fundraiser) throw createError('Fundraiser not found', 404);

  const creatorId = (fundraiser.creator?._id || fundraiser.creator)?.toString();
  const userId = (req.user?._id || req.user?.id)?.toString();
  if (creatorId !== userId && req.user.role !== 'admin') throw createError('Not authorized', 403);

  const transactions = await Transaction.find({
    fundraiser: fundraiser._id,
    type: 'payout',
  }).sort({ createdAt: -1 }).lean();

  res.json(transactions);
};

module.exports = { createFundraiser, listFundraisers, getFundraiser, closeFundraiser, deleteFundraiser, listMyFundraisers, updateFundraiser, requestWithdrawal, getFundraiserTransactions, getAdminFundraisers };

