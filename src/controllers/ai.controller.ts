import { Request, Response, NextFunction } from 'express';
import { AIService } from '../services/ai.service';
import { HTTPError } from '../utils/errors';
import { z } from 'zod';
import { TONES } from '../config/tones';

export const aiSchema = z.object({
  type: z.enum(['summary', 'expertise', 'variation', 'captions', 'script']),
  content: z.string().max(5000),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']).optional(),
  count: z.number().int().min(1).max(5).optional().default(1),
  tone: z.enum(TONES).optional().default('Casual'),
  niche: z.string().min(3).max(50).optional().default('general')
});

export class AIController {
  private static aiService = new AIService();

  static async generateContent(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = aiSchema.safeParse(req.body);
      if (!validation.success) {
        throw new HTTPError('Invalid AI request parameters', 400);
      }

      const { type, content, language, tone, niche } = validation.data;
      const count = validation.data.count;
      const result = await this.aiService.generateContent(
        type,
        content,
        language,
        type === 'script' ? 1 : count,
        tone,
        niche
      );

      res.json({
        success: true,
        [type]: result
      });
    } catch (error) {
      next(error);
    }
  }

  static handleAIGeneration = AIController.generateContent;
}

export const handleAIGeneration = AIController.handleAIGeneration; 