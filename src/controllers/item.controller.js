const Item = require('../models/Item');
const Notification = require('../models/Notification');
const { createError } = require('../middleware/errorHandler');
const redis = require('../config/redis');
const aiService = require('../services/ai.service');
const blockchainService = require('../services/blockchain.service');

// GET /api/items — browse with filters, geospatial near, pagination
const getItems = async (req, res) => {
  const {
    category, status = 'approved', search,
    lat, lng, radius = 50,
    page = 1, limit = 20, sort = 'recent'
  } = req.query;

  // Build a cache key from the query params (skip geo queries — too unique)
  const cacheKey = (!lat && !lng) ? `cache:items:${status}:${category||'all'}:${sort}:${page}:${limit}:${search||''}` : null;
  if (cacheKey) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }
  }

  const query = { status };
  if (category && category !== 'all') query.category = category;
  if (search) query.$text = { $search: search };

  let mongoSort = { createdAt: -1 };
  if (sort === 'popular') mongoSort = { viewCount: -1 };

  let items, total;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  if (lat && lng) {
    const radiusInRadians = parseInt(radius) / 6371;
    const geoQuery = {
      ...query,
      'location.coordinates': {
        $geoWithin: { $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians] }
      }
    };
    [items, total] = await Promise.all([
      Item.find(geoQuery).sort(mongoSort).populate('giver', 'name avatar trustScore idVerified').skip(skip).limit(parseInt(limit)),
      Item.countDocuments(geoQuery),
    ]);
  } else {
    [items, total] = await Promise.all([
      Item.find(query).sort(mongoSort).populate('giver', 'name avatar trustScore idVerified').skip(skip).limit(parseInt(limit)),
      Item.countDocuments(query),
    ]);
  }

  const payload = { success: true, data: { items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } };

  // Cache for 30s
  if (cacheKey) await redis.set(cacheKey, payload, 30);

  res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.set('X-Cache', 'MISS');
  res.json(payload);
};

// GET /api/items/categories
const getCategories = async (req, res) => {
  const cacheKey = 'cache:items:categories';
  const cached = await redis.get(cacheKey);
  if (cached) {
    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    res.set('X-Cache', 'HIT');
    return res.json(cached);
  }

  const { CATEGORIES } = require('../models/Item');
  const counts = await Item.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const countMap = {};
  counts.forEach(c => { countMap[c._id] = c.count; });
  const categories = CATEGORIES.map(cat => ({ name: cat, count: countMap[cat] || 0 }));
  const payload = { success: true, data: categories };
  await redis.set(cacheKey, payload, 300); // 5 min
  res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  res.set('X-Cache', 'MISS');
  res.json(payload);
};

// GET /api/items/:id
const getItem = async (req, res) => {
  const item = await Item.findById(req.params.id)
    .populate('giver', 'name avatar trustScore idVerified bio reviewCount location.city location.country');
  if (!item) throw createError('Item not found', 404);
  if (item.status !== 'approved' && (!req.user || (req.user._id.toString() !== item.giver._id.toString() && req.user.role !== 'admin'))) {
    throw createError('Item not available', 404);
  }
  // Increment view count (fire and forget)
  Item.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).catch(() => {});
  res.json({ success: true, data: item });
};

// POST /api/items — giver creates item
const createItem = async (req, res) => {
  const { title, description, category, condition, deliveryMethod, deliveryNotes, tags } = req.body;
  if (!title || !description || !category) throw createError('Title, description and category are required');

  const images = req.files ? req.files.map(f => ({ fileId: f.gridfs.id, url: `/api/uploads/${f.gridfs.id}` })) : [];

  // Location from body or from user profile
  let location = req.user.location;
  if (req.body.lat && req.body.lng) {
    location = {
      type: 'Point',
      coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
      city: req.body.city || '',
      country: req.body.country || '',
    };
  }

  const item = await Item.create({
    title, description, category, condition, deliveryMethod, deliveryNotes,
    images, location,
    giver: req.user._id,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
  });

  // Fire AI hook (non-blocking)
  aiService.analyzeItemNeed(item).catch(() => {});

  // Notify admins (simplified — in production use socket or email)
  await redis.delPattern('cache:items:*');

  res.status(201).json({ success: true, message: 'Item submitted for review', data: item });
};

// PATCH /api/items/:id
const updateItem = async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) throw createError('Item not found', 404);
  if (item.giver.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw createError('Not authorized', 403);
  }

  const allowed = ['title', 'description', 'condition', 'deliveryMethod', 'deliveryNotes', 'tags'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const updated = await Item.findByIdAndUpdate(req.params.id, updates, { new: true });
  await redis.delPattern('cache:items:*');
  res.json({ success: true, data: updated });
};

// DELETE /api/items/:id
const deleteItem = async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) throw createError('Item not found', 404);
  if (item.giver.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw createError('Not authorized', 403);
  }
  await item.deleteOne();
  await redis.delPattern('cache:items:*');
  res.json({ success: true, message: 'Item deleted' });
};

// GET /api/items/my — giver's own items
const getMyItems = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = { giver: req.user._id };
  if (status) query.status = status;

  const [items, total] = await Promise.all([
    Item.find(query).sort('-createdAt').skip((page - 1) * limit).limit(parseInt(limit)),
    Item.countDocuments(query),
  ]);
  res.json({ success: true, data: { items, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

module.exports = { getItems, getCategories, getItem, createItem, updateItem, deleteItem, getMyItems };
