import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { getStats, getUsers, getFinancials, getRevenueData } from '../controllers/adminController';
import { getAllConfigs, getConfigByKey, updateConfig } from '../controllers/configController';

const router = Router();

// Secure all routes
router.use(authenticate, authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/financials', getFinancials);
router.get('/revenue-chart', getRevenueData);

// Config routes
router.get('/config', getAllConfigs);
router.get('/config/:key', getConfigByKey);
router.post('/config', updateConfig);

export default router;
