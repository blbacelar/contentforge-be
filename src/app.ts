import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { createApiRouter } from './routes/api';
import { requestLogger } from './middleware/requestLogger';
import { healthRoutes } from './routes/health.routes';



export function initializeApp() {
  const app = express();
  
  // Trust the first proxy (e.g., Render's proxy)
  app.set('trust proxy', 1);
  
  // Add request logging before other middleware
  app.use(requestLogger);
  
  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.NODE_ENV === 'development' ? '*' : process.env.CORS_ORIGIN
  }));

  app.use(cors({
    origin: ['http://localhost:3000', 'https://contentforge-be.onrender.com'],
    credentials: true
  }));
  
  app.use(express.json({ limit: '10mb' }));

  // Rate limiting
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  }));

  // Mount health routes
  app.use('/api/health', healthRoutes);

  // API routes
  app.use('/api', createApiRouter());
  

  // Error handling
  app.use(errorHandler);

  return app;
} 