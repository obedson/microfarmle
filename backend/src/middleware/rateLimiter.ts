import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export const createRateLimit = (windowMs: number, maxRequests: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    Object.keys(store).forEach(k => {
      if (store[k].resetTime < now) {
        delete store[k];
      }
    });

    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }

    if (store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }

    if (store[key].count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later.',
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
      });
    }

    store[key].count++;
    next();
  };
};

// Common rate limiters
export const authLimiter = createRateLimit(15 * 60 * 1000, 5); // 5 requests per 15 minutes
export const apiLimiter = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
export const uploadLimiter = createRateLimit(60 * 60 * 1000, 10); // 10 uploads per hour
