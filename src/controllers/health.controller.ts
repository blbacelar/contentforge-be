import { Request, Response, NextFunction } from 'express';
import { AIService } from '../services/ai.service';
import { logger } from '../utils/logger';

export class HealthController {
  private static aiService = new AIService();

  static async checkHealth(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Starting API health check');
      const status = await HealthController.aiService.checkAPIHealth();
      
      res.json({
        success: true,
        status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Health check failed:', error);
      next(error);
    }
  }

  static async testAIEndpoint(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Starting AI test endpoint');
      const result = await HealthController.aiService.generateContent(
        'captions',
        'This is a test message to verify the AI service is working correctly.',
        'en-US',
        1,
        'Casual',
        'general'
      );

      res.json({
        success: true,
        test: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('AI test failed:', error);
      next(error);
    }
  }
}

export const checkHealth = HealthController.checkHealth;
export const testAIEndpoint = HealthController.testAIEndpoint;