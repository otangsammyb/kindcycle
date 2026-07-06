const Request = require('../models/Request');
const Item = require('../models/Item');
const Notification = require('../models/Notification');
const { createError } = require('../middleware/errorHandler');

// POST /api/requests
const createRequest = async (req, res) => {
  const { itemId, justification, preferredDelivery, meetingAddress } = req.body;
  if (!itemId || !justification) throw createError('Item ID and justification are required');

  const item = await Item.findById(itemId).populate('giver', 'name');
  if (!item) throw createError('Item not found', 404);
  if (item.status !== 'approved') throw createError('Item is not available', 400);
  if (item.giver._id.toString() === req.user._id.toString()) throw createError('Cannot request your own item', 400);

  // Check existing request
  const existing = await Request.findOne({ item: itemId, receiver: req.user._id });
  if (existing) throw createError('You already have a pending request for this item', 409);

  const requestDoc = await Request.create({
    item: itemId,
    receiver: req.user._id,
    giver: item.giver._id,
    justification,
    preferredDelivery: preferredDelivery || 'pickup',
    meetingAddress: meetingAddress || '',
  });

  // Increment request count
  Item.findByIdAndUpdate(itemId, { $inc: { requestCount: 1 } }).catch(() => {});

  // Notify giver
  await Notification.create({
    user: item.giver._id,
    type: 'request_received',
    title: 'New item request',
    message: `${req.user.name} requested your item: "${item.title}"`,
    link: `/dashboard/giver?tab=requests`,
    metadata: { requestId: requestDoc._id, itemId },
  });

  res.status(201).json({ success: true, message: 'Request submitted', data: requestDoc });
};

// GET /api/requests — own requests
const getRequests = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (req.user.role === 'receiver') query.receiver = req.user._id;
  else if (req.user.role === 'giver') query.giver = req.user._id;
  if (status) query.status = status;

  const [requests, total] = await Promise.all([
    Request.find(query).sort('-createdAt')
      .populate('item', 'title images category status')
      .populate('receiver', 'name avatar idVerified trustScore')
      .populate('giver', 'name avatar')
      .skip((page - 1) * limit).limit(parseInt(limit)),
    Request.countDocuments(query),
  ]);
  res.json({ success: true, data: { requests, total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

// GET /api/requests/:id
const getRequest = async (req, res) => {
  const request = await Request.findById(req.params.id)
    .populate('item').populate('receiver', 'name avatar trustScore idVerified').populate('giver', 'name avatar');
  if (!request) throw createError('Request not found', 404);
  if (![request.receiver._id.toString(), request.giver._id.toString()].includes(req.user._id.toString()) && req.user.role !== 'admin') {
    throw createError('Not authorized', 403);
  }
  res.json({ success: true, data: request });
};

// PATCH /api/requests/:id/accept
const acceptRequest = async (req, res) => {
  const request = await Request.findById(req.params.id).populate('item receiver');
  if (!request) throw createError('Request not found', 404);
  if (request.giver.toString() !== req.user._id.toString()) throw createError('Not authorized', 403);
  if (request.status !== 'pending') throw createError('Request is not pending', 400);

  request.status = 'accepted';
  request.giverNote = req.body.giverNote || '';
  request.meetingDate = req.body.meetingDate ? new Date(req.body.meetingDate) : null;
  await request.save();

  // Reserve the item
  await Item.findByIdAndUpdate(request.item._id, { status: 'reserved' });

  // Reject other pending requests for same item
  await Request.updateMany(
    { item: request.item._id, _id: { $ne: request._id }, status: 'pending' },
    { status: 'rejected', giverNote: 'Item was reserved for another receiver' }
  );

  // Notify receiver
  await Notification.create({
    user: request.receiver._id,
    type: 'request_accepted',
    title: 'Your request was accepted!',
    message: `Your request for "${request.item.title}" was accepted.`,
    link: `/dashboard/receiver`,
  });

  res.json({ success: true, message: 'Request accepted', data: request });
};

// PATCH /api/requests/:id/reject
const rejectRequest = async (req, res) => {
  const request = await Request.findById(req.params.id).populate('item receiver');
  if (!request) throw createError('Request not found', 404);
  if (request.giver.toString() !== req.user._id.toString()) throw createError('Not authorized', 403);
  if (request.status !== 'pending') throw createError('Request is not pending', 400);

  request.status = 'rejected';
  request.giverNote = req.body.reason || '';
  await request.save();

  await Notification.create({
    user: request.receiver._id,
    type: 'request_rejected',
    title: 'Request update',
    message: `Your request for "${request.item.title}" was not accepted.`,
    link: `/browse`,
  });

  res.json({ success: true, message: 'Request rejected', data: request });
};

// PATCH /api/requests/:id/complete — mark item as given
const completeRequest = async (req, res) => {
  const request = await Request.findById(req.params.id).populate('item');
  if (!request) throw createError('Request not found', 404);
  if (request.giver.toString() !== req.user._id.toString()) throw createError('Not authorized', 403);
  if (request.status !== 'accepted') throw createError('Request must be accepted first', 400);

  request.status = 'accepted';
  request.completedAt = new Date();
  await request.save();

  await Item.findByIdAndUpdate(request.item._id, { status: 'given', givenAt: new Date() });

  res.json({ success: true, message: 'Item marked as given', data: request });
};

module.exports = { createRequest, getRequests, getRequest, acceptRequest, rejectRequest, completeRequest };
