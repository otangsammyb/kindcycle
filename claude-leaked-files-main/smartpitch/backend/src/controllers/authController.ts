import { Request, Response, NextFunction } from 'express';
import { User, IUser } from '../models/User';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';

const createSendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = signAccessToken({
    id: user._id.toString(),
    role: user.role,
    plan: user.plan,
  });

  const refreshToken = signRefreshToken({ id: user._id.toString() });

  if (!user.refreshTokens) {
    user.refreshTokens = [];
  }
  user.refreshTokens.push(refreshToken);
  user.save({ validateBeforeSave: false });

  res.status(statusCode).json({
    status: 'success',
    token: accessToken,
    refreshToken,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        usage: user.usage,
      },
    },
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', 400));
    }

    const newUser = await User.create({
      name,
      email,
      password,
      plan: 'free',
      role: 'user',
    });

    createSendToken(newUser, 201, res);
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    console.log(`[AUTH] Login attempt for: ${email}`);

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password +refreshTokens');
    if (!user || !(await user.comparePassword(password))) {
      return next(new AppError('Incorrect email or password', 401));
    }

    console.log(`[AUTH] Login successful for: ${user.email} (Role: ${user.role})`);
    createSendToken(user, 200, res);
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.id).select('+refreshTokens');
      if (user) {
        user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
        await user.save({ validateBeforeSave: false });
      }
    }
    
    res.status(200).json({ status: 'success' });
  } catch (err) {
    next(err);
  }
};

export const refreshAuthToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 400));
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id).select('+refreshTokens');

    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return next(new AppError('Invalid refresh token', 401));
    }

    // Rotate token
    user.refreshTokens = user.refreshTokens.filter((token) => token !== refreshToken);
    
    createSendToken(user, 200, res);
  } catch (err) {
    return next(new AppError('Invalid refresh token', 401));
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById((req as any).user.id);
    if (!user) return next(new AppError('User not found', 404));

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          plan: user.plan,
          usage: user.usage,
          githubToken: user.githubToken ? '********' : null
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;
    const user = await User.findById((req as any).user.id);
    if (!user) return next(new AppError('User not found', 404));

    if (name) user.name = name;
    await user.save();

    res.status(200).json({
      status: 'success',
      data: { user: { id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan, usage: user.usage } }
    });
  } catch (err) {
    next(err);
  }
};

export const updateGithubToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    const user = await User.findById((req as any).user.id);
    if (!user) return next(new AppError('User not found', 404));

    user.githubToken = token;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'GitHub token updated successfully'
    });
  } catch (err) {
    next(err);
  }
};
