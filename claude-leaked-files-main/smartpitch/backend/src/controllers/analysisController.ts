import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { fetchRepoContents } from '../services/github/repoFetcher';
import { analyzeRepoStream } from '../services/ai/analysisEngine';
import { Analysis } from '../models/Analysis';
import { User } from '../models/User';
import { Config } from '../models/Config';
import { AppError } from '../utils/AppError';

export const startAnalysis = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { repoUrl, mode = 'standard', githubToken } = req.body;
    const userId = req.user!.id;

    if (!repoUrl) {
      return next(new AppError('GitHub repository URL is required', 400));
    }

    const user = await User.findById(userId);
    if (!user) return next(new AppError('User not found', 404));

    // Fetch dynamic limits
    const limitConfig = await Config.findOne({ key: 'PLAN_LIMITS' });
    const planLimits = limitConfig?.value || { free: 1, hacker: 1, founder: 5, agency: Infinity };
    const limit = planLimits[user.plan] || 1;

    if (user.usage.analysesThisMonth >= limit) {
      return next(new AppError('You have reached the analysis limit for your plan. Please upgrade.', 403));
    }

    // Determine if red_team mode is allowed
    const finalMode = mode === 'red_team' && ['founder', 'agency'].includes(user.plan) ? 'red_team' : 'standard';

    // 1. Fetch from GitHub
    const repoData = await fetchRepoContents(repoUrl, githubToken || user.githubToken);

    // 2. Increment usage upfront
    await user.incrementUsage();

    // 3. Hand off to AI streaming service
    // Note: This function will stream directly to res and close it.
    await analyzeRepoStream(userId, repoData, finalMode as 'standard' | 'red_team', res);

  } catch (err) {
    // If it's a synchronous error before streaming started
    if (!res.headersSent) {
      next(err);
    } else {
      res.write(`data: ${JSON.stringify({ event: 'error', message: err instanceof Error ? err.message : 'Unknown error' })}\n\n`);
      res.end();
    }
  }
};

export const getAnalyses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const analyses = await Analysis.find({ userId: req.user!.id })
      .select('-result.pitchSlides -result.techAnalysis') // Exclude heavy text
      .sort('-createdAt');
      
    res.status(200).json({ status: 'success', data: { analyses } });
  } catch (err) {
    next(err);
  }
};

export const getAnalysisById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const analysis = await Analysis.findOne({ _id: req.params.id, userId: req.user!.id });
    
    if (!analysis) {
      return next(new AppError('Analysis not found', 404));
    }
    
    res.status(200).json({ status: 'success', data: { analysis } });
  } catch (err) {
    next(err);
  }
};

export const deleteAnalysis = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const analysis = await Analysis.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
    
    if (!analysis) {
      return next(new AppError('Analysis not found', 404));
    }
    
    res.status(200).json({ status: 'success', data: null });
  } catch (err) {
    next(err);
  }
};
