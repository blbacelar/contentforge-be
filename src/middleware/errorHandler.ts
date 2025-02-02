import { Request, Response, NextFunction } from 'express';
import { HTTPError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('❌ Error handling request:', {
    path: req.path,
    error: err.message,
    stack: err.stack
  });

  if (err instanceof HTTPError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.statusCode,
        message: err.message,
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }

  // Production vs development error handling
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: {
        code: 500,
        message: 'Internal Server Error'
      }
    });
  }

  return res.status(500).json({
    error: {
      code: 500,
      message: err.message,
      stack: err.stack
    }
  });
}; 