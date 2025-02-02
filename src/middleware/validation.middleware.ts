import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

const validationMiddleware = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ error: 'Validation failed' });
    }
  };
};

export default validationMiddleware;

export const validateRequest = validationMiddleware; 