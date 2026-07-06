const express = require('express');
const router = express.Router();
const {
  getStats, getDetailedStats, getPendingItems, approveItem, rejectItem,
  getUsers, getPendingVerifications, verifyUser, banUser, deleteUser,
  getFundraisers, closeFundraiserAdmin, notifyUser, getTransactions,
} = require('../controllers/admin.controller');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

// All admin routes require admin role
router.use(verifyToken, requireRole('admin'));

router.get('/stats', getStats);
router.get('/stats/detailed', getDetailedStats);
router.get('/pending-items', getPendingItems);
router.patch('/items/:id/approve', approveItem);
router.patch('/items/:id/reject', rejectItem);
router.get('/users', getUsers);
router.get('/pending-verifications', getPendingVerifications);
router.patch('/users/:id/verify', verifyUser);
router.patch('/users/:id/ban', banUser);
router.delete('/users/:id', deleteUser);

// Fundraisers
router.get('/fundraisers', getFundraisers);
router.patch('/fundraisers/:id/close', closeFundraiserAdmin);

// Notify users
router.post('/notify-user', notifyUser);

// Transactions
router.get('/transactions', getTransactions);

module.exports = router;
