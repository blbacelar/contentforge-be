import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { HTTPError } from '../utils/errors';
import { AIService } from '../services/ai.service';
import { ScriptStructure } from '../types/script';
import { TONES } from '../config/tones';
import { logger } from '../utils/logger';

export const textCaptionsSchema = z.object({
  text: z.string().min(100).max(5000),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']),
  count: z.number().int().min(1).max(5).optional().default(1),
  tone: z.enum(TONES).optional().default('Casual'),
  niche: z.string().min(3).max(50).optional().default('general')
});

export const textScriptSchema = z.object({
  text: z.string().min(50).max(5000),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']).optional().default('en-US'),
  tone: z.enum(TONES).optional().default('Casual'),
  niche: z.string().min(3).max(50).optional().default('general')
});

export class TextController {
  private static aiService = new AIService();

  static async generateTextCaptions(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = textCaptionsSchema.safeParse(req.body);
      if (!validation.success) {
        throw new HTTPError(
          'Text must be between 100 and 5000 characters for caption generation',
          400
        );
      }

      const { text, language, count, tone, niche } = validation.data;

      try {
        const captions = await TextController.aiService.generateContent(
          'captions',
          text,
          language,
          count,
          tone,
          niche

        ) as string[];

        res.json({
          success: true,
          captions: captions.map((content: string, id: number) => ({ id, content, type: 'text' }))
        });
      } catch (aiError) {
        // Log the actual error for debugging
        logger.error('AI Service Error:', aiError);
        throw new HTTPError(
          'Failed to generate captions. Please try again or contact support if the issue persists.',
          500
        );
      }
    } catch (error) {
      next(error);
    }
  }

  static async generateTextScript(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = textScriptSchema.safeParse(req.body);
      if (!validation.success) {
        throw new HTTPError('Invalid text input for script generation', 400);
      }
      const { text, language, tone, niche } = validation.data;
      const script = await TextController.aiService.generateContent(
        'script',
        text,
        language,
        1,
        tone,
        niche
      ) as ScriptStructure;
      res.json({
        success: true,
        script
      });
    } catch (error) {
      next(error);
    }
  }
}

export const generateTextCaptions = TextController.generateTextCaptions;
export const generateTextScript = TextController.generateTextScript; 