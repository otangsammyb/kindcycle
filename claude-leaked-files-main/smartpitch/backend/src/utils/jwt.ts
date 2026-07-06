import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export const signAccessToken = (payload: { id: string; role: string; plan: string }): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

export const signRefreshToken = (payload: { id: string }): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
};

export const verifyRefreshToken = (token: string): { id: string } => {
  return jwt.verify(token, config.jwt.refreshSecret) as { id: string };
};
