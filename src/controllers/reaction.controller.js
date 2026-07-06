const Reaction = require('../models/Reaction');
const Item = require('../models/Item');
const { createError } = require('../middleware/errorHandler');

// POST /api/reactions — toggle reaction
const toggleReaction = async (req, res) => {
  const { itemId, emoji } = req.body;
  if (!itemId || !emoji) throw createError('itemId and emoji are required');

  const existing = await Reaction.findOne({ user: req.user._id, item: itemId });

  if (existing) {
    if (existing.emoji === emoji) {
      // Remove reaction (toggle off)
      await existing.deleteOne();
      await Item.findByIdAndUpdate(itemId, { $inc: { reactionCount: -1 } });
      return res.json({ success: true, action: 'removed', emoji });
    } else {
      // Change emoji
      existing.emoji = emoji;
      await existing.save();
      return res.json({ success: true, action: 'changed', emoji });
    }
  }

  await Reaction.create({ user: req.user._id, item: itemId, emoji });
  await Item.findByIdAndUpdate(itemId, { $inc: { reactionCount: 1 } });
  res.status(201).json({ success: true, action: 'added', emoji });
};

// GET /api/reactions/:itemId
const getItemReactions = async (req, res) => {
  const reactions = await Reaction.find({ item: req.params.itemId })
    .populate('user', 'name avatar');

  // Group by emoji
  const grouped = {};
  reactions.forEach(r => {
    if (!grouped[r.emoji]) grouped[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
    grouped[r.emoji].count++;
    grouped[r.emoji].users.push({ name: r.user.name, avatar: r.user.avatar });
  });

  // My reaction
  let myReaction = null;
  if (req.user) {
    const mine = reactions.find(r => r.user._id.toString() === req.user._id.toString());
    if (mine) myReaction = mine.emoji;
  }

  res.json({ success: true, data: { reactions: Object.values(grouped), myReaction, total: reactions.length } });
};

module.exports = { toggleReaction, getItemReactions };
