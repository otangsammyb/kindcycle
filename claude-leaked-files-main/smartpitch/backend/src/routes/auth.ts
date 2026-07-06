import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, logout, refreshAuthToken, getMe, updateProfile, updateGithubToken } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  ],
  register
);

router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshAuthToken);
router.get('/me', authenticate, getMe);
router.patch('/update-profile', authenticate, updateProfile);
router.post('/github-token', authenticate, updateGithubToken);

export default router;
