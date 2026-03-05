import { Request, Response, NextFunction } from 'express';

const sanitizeString = (value: any): any => {
  if (typeof value === 'string') {
    // Remove HTML tags and dangerous characters
    return value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeString);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = sanitizeString(value[key]);
      return acc;
    }, {} as any);
  }
  return value;
};

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeString(req.body);
  }
  if (req.query) {
    req.query = sanitizeString(req.query);
  }
  if (req.params) {
    req.params = sanitizeString(req.params);
  }
  next();
};
