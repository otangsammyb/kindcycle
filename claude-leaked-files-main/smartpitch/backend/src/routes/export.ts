import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { createExport, downloadExport } from '../controllers/exportController';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  [
    body('analysisId').notEmpty().withMessage('Analysis ID is required'),
    body('type').isIn(['pdf', 'pptx']).withMessage('Type must be pdf or pptx'),
    body('style').optional().isIn(['corporate', 'startup', 'technical', 'minimal', 'bold']),
  ],
  createExport
);

router.get('/:id/download', downloadExport);

export default router;
