import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import { createApiRouter } from './routes/api';
import { requestLogger } from './middleware/requestLogger';
import { AIService } from './services/ai.service';

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

  // API routes
  app.use('/api', createApiRouter());

  // Health check
  app.get('/health', async (req, res) => {
    const healthcheck: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        deepseek: process.env.DEEPSEEK_API_KEY ? 'configured' : 'not configured',
        cloudinary: process.env.CLOUDINARY_API_KEY ? 'configured' : 'not configured',
        deepseekStatus: 'unknown'
      }
    };

    try {
      if (process.env.DEEPSEEK_API_KEY) {
        const aiService = new AIService();
        healthcheck.services.deepseekStatus = await aiService.checkAPIHealth();
      }
      
      res.status(200).json(healthcheck);
    } catch (error) {
      healthcheck.status = 'error';
      healthcheck.error = error instanceof Error ? error.message : 'Unknown error';
      res.status(503).json(healthcheck);
    }
  });

  // Error handling
  app.use(errorHandler);

  return app;
} 