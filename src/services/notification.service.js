/**
 * KindCycle Notification Service
 * Handles real-time SSE delivery + MongoDB persistence.
 */
const Notification = require('../models/Notification');

// Map: userId (string) => Set of res objects
const clients = new Map();

/**
 * Register an SSE client.
 * @param {string} userId
 * @param {import('express').Response} res
 */
const addClient = (userId, res) => {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
};

/**
 * Remove an SSE client (on connection close).
 */
const removeClient = (userId, res) => {
  const set = clients.get(userId);
  if (set) {
    set.delete(res);
    if (set.size === 0) clients.delete(userId);
  }
};

/**
 * Send a notification to a user.
 * Saves to DB and pushes via SSE if the user has an active connection.
 * @param {Object} opts
 * @param {string} opts.userId
 * @param {string} opts.type
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} [opts.link]
 * @param {Object} [opts.metadata]
 * @returns {Promise<import('../models/Notification')>}
 */
const send = async ({ userId, type, title, message, link = null, metadata = {} }) => {
  // Persist in DB
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    link,
    metadata,
  });

  // Push via SSE
  const set = clients.get(userId.toString());
  if (set && set.size > 0) {
    const payload = `data: ${JSON.stringify({
      _id: notification._id,
      type,
      title,
      message,
      link,
      metadata,
      createdAt: notification.createdAt,
    })}\n\n`;
    for (const res of set) {
      try { res.write(payload); } catch { /* tab closed */ }
    }
  }

  return notification;
};

/**
 * Broadcast a notification to ALL connected users (system-wide announcements).
 */
const broadcast = async ({ type, title, message, link = null, metadata = {} }) => {
  for (const [userId] of clients) {
    await send({ userId, type, title, message, link, metadata }).catch(() => {});
  }
};

module.exports = { addClient, removeClient, send, broadcast };
