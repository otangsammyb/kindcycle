const express = require('express');
const router = express.Router();
const { getLedger } = require('../controllers/ledger.controller');
const { cacheMiddleware } = require('../middleware/cache');

router.get('/', cacheMiddleware(60, 'ledger'), getLedger);

module.exports = router;
