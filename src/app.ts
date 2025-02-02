import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { createApiRouter } from './routes/api';
import { requestLogger } from './middleware/requestLogger';

export function initializeApp() {
  const app = express();
  
  // Add request logging before other middleware
  app.use(requestLogger);
  
  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.NODE_ENV === 'development' ? '*' : process.env.CORS_ORIGIN
  }));
  app.use(express.json({ limit: '10mb' }));

  // Rate limiting
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  }));

  // API routes
  app.use('/api', createApiRouter());

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  });

  // Error handling
  app.use(errorHandler);

  return app;
} 