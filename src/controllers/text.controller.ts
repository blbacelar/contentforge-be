import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { HTTPError } from '../utils/errors';
import { AIService } from '../services/ai.service';
import { ScriptStructure } from '../types/script';

export const textCaptionsSchema = z.object({
  text: z.string().min(100).max(5000),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']),
  count: z.number().int().min(1).max(5).optional().default(1)
});

export const textScriptSchema = z.object({
  text: z.string().min(50).max(5000),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']).optional().default('en-US')
});

export class TextController {
  private static aiService = new AIService();

  static async generateTextCaptions(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = textCaptionsSchema.safeParse(req.body);
      if (!validation.success) {
        throw new HTTPError('Invalid text input', 400);
      }

      const captions = await TextController.aiService.generateContent(
        'captions',
        validation.data.text,
        validation.data.language,
        validation.data.count
      ) as string[];

      res.json({
        success: true,
        captions: captions.map((content: string, id: number) => ({ id, content, type: 'text' }))
      });
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
      const { text, language } = validation.data;
      const script = await TextController.aiService.generateContent(
        'script',
        text,
        language,
        1
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