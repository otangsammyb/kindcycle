import { Request, Response, NextFunction } from 'express';
import { Config } from '../models/Config';
import { AppError } from '../utils/AppError';

export const getAllConfigs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const configs = await Config.find();
    res.status(200).json({
      status: 'success',
      data: { configs }
    });
  } catch (err) {
    next(err);
  }
};

export const getConfigByKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await Config.findOne({ key: req.params.key });
    if (!config) return next(new AppError('Config not found', 404));

    res.status(200).json({
      status: 'success',
      data: { config }
    });
  } catch (err) {
    next(err);
  }
};

export const updateConfig = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key, value, description } = req.body;
    
    let config = await Config.findOne({ key });
    
    if (config) {
      config.value = value;
      if (description) config.description = description;
      await config.save();
    } else {
      config = await Config.create({ key, value, description });
    }

    res.status(200).json({
      status: 'success',
      data: { config }
    });
  } catch (err) {
    next(err);
  }
};
