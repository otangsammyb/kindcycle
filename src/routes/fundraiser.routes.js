const express = require('express');
const router = express.Router();
const { verifyToken, optionalAuth } = require('../middleware/auth');
const {
  createFundraiser, listFundraisers, getFundraiser,
  closeFundraiser, deleteFundraiser, listMyFundraisers,
  updateFundraiser, requestWithdrawal, getFundraiserTransactions,
  getAdminFundraisers,
} = require('../controllers/fundraiser.controller');
const { requireAdmin } = require('../middleware/auth');

// Public
router.get('/', listFundraisers);
router.get('/my', verifyToken, listMyFundraisers);       // alias used by dashboard
router.get('/my/list', verifyToken, listMyFundraisers);
router.get('/:id', optionalAuth, getFundraiser);

// Protected
router.post('/', verifyToken, createFundraiser);
router.patch('/:id', verifyToken, updateFundraiser);
router.patch('/:id/close', verifyToken, closeFundraiser);
router.post('/:id/withdraw', verifyToken, requestWithdrawal);
router.get('/:id/transactions', verifyToken, getFundraiserTransactions);
router.delete('/:id', verifyToken, deleteFundraiser);

module.exports = router;
