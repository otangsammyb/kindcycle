const express = require('express');
const router = express.Router();
const { createRequest, getRequests, getRequest, acceptRequest, rejectRequest, completeRequest } = require('../controllers/request.controller');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.use(verifyToken);

router.post('/', requireRole('receiver'), createRequest);
router.get('/', getRequests);
router.get('/:id', getRequest);
router.patch('/:id/accept', requireRole('giver'), acceptRequest);
router.patch('/:id/reject', requireRole('giver'), rejectRequest);
router.patch('/:id/complete', requireRole('giver'), completeRequest);

module.exports = router;
