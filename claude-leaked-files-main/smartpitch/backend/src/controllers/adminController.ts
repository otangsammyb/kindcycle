import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Payment } from '../models/Payment';
import { Analysis } from '../models/Analysis';
import { AppError } from '../utils/AppError';

export const getStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeSubscribers = await User.countDocuments({ plan: { $ne: 'free' } });
    
    // Calculate MRR (simple sum of completed monthly payments in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentPayments = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const mrr = recentPayments[0]?.total || 0;
    const totalPitches = await Analysis.countDocuments({ status: 'completed' });
    
    // Estimate AI Cost ($0.01 per 1k tokens as a dummy factor for now)
    const totalTokensUsed = await Analysis.aggregate([
      { $group: { _id: null, total: { $sum: '$tokensUsed' } } }
    ]);
    const estCost = ((totalTokensUsed[0]?.total || 0) / 1000) * 0.01;

    res.status(200).json({
      status: 'success',
      data: {
        mrr: `$${mrr.toLocaleString()}`,
        activeSubscribers,
        totalPitches,
        estCost: `$${estCost.toFixed(2)}`,
        trends: {
          mrr: '+12.5%', // Trends would require comparison logic, keeping as consistent placeholders for now
          subscribers: '+8.2%',
          pitches: '+15.4%',
          cost: '+5.1%'
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('name email plan usage createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { users }
    });
  } catch (err) {
    next(err);
  }
};

export const getFinancials = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payments = await Payment.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      status: 'success',
      data: { payments }
    });
  } catch (err) {
    next(err);
  }
};

export const getRevenueData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Group monthly revenue for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const revenueData = await Payment.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$amount' },
          month: { $first: { $dateToString: { format: '%b', date: '$createdAt' } } }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.status(200).json({
      status: 'success',
      data: { revenueData }
    });
  } catch (err) {
    next(err);
  }
};
