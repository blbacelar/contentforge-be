import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`📥 ${req.method} ${req.path} - Request received`);
  
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`📤 ${req.method} ${req.path} - Response sent (${duration}ms) - Status: ${res.statusCode}`);
  });
  
  next();
}; 