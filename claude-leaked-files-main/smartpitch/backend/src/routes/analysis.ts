import { Router } from 'express';
import { body } from 'express-validator';
import { startAnalysis, getAnalyses, getAnalysisById, deleteAnalysis } from '../controllers/analysisController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All analysis routes require authentication
router.use(authenticate);

// Start new analysis (Streams SSE)
router.post(
  '/analyze',
  [body('repoUrl').isURL().withMessage('Please provide a valid GitHub URL')],
  startAnalysis
);

// Get list of previous analyses
router.get('/', getAnalyses);

// Get specific analysis detail
router.get('/:id', getAnalysisById);
router.delete('/:id', deleteAnalysis);

export default router;
