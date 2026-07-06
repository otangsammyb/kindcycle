const express = require('express');
const router = express.Router();
const { initiatePayment, handleWebhook, getPaymentStatus, getMyTransactions } = require('../controllers/payment.controller');
const { verifyToken } = require('../middleware/auth');

// Webhook — raw body parsing done in server.js
router.post('/webhook', handleWebhook);

// Protected
router.use(verifyToken);
router.post('/initiate', initiatePayment);
router.get('/my', getMyTransactions);
router.get('/status/:ref', getPaymentStatus);

module.exports = router;
