import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    plan: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token;
    const authHeader = req.headers.authorization;
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      throw new AppError('Authentication required', 401);
    }
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string;
      role: string;
      plan: string;
    };

    const user = await User.findById(decoded.id).select('_id role plan');
    if (!user) {
      throw new AppError('User not found', 401);
    }

    req.user = { id: decoded.id, role: decoded.id, plan: user.plan };
    req.user = { id: user._id.toString(), role: user.role, plan: user.plan };
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else {
      next(err);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new AppError('Access denied', 403));
      return;
    }
    next();
  };
};

export const requirePlan = (...plans: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }
    if (!plans.includes(req.user.plan)) {
      next(
        new AppError(
          `This feature requires one of these plans: ${plans.join(', ')}. Please upgrade your subscription.`,
          403
        )
      );
      return;
    }
    next();
  };
};
