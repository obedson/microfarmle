import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(40).toString('hex');
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};
