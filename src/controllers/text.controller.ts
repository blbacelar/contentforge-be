import { Request, Response, NextFunction } from 'express';
import { HTTPError } from '../utils/errors';
import { CaptionGenerationService } from '../services/caption-generation.service';
import { ScriptGenerationService } from '../services/script-generation.service';
import { ScriptStructure } from '../types/script';
import { logger } from '../utils/logger';
import { textCaptionsSchema, textScriptSchema, textCombinedSchema } from '../config/schemas';
import { UnifiedGenerationService } from '../services/unified-generation.service';

export class TextController {
  private static captionService = new CaptionGenerationService();
  private static scriptService = new ScriptGenerationService();
  private static unifiedService = new UnifiedGenerationService();

  static async generateTextCaptions(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = textCaptionsSchema.safeParse(req.body);
      if (!validation.success) {
        throw new HTTPError('Invalid caption request parameters', 400);
      }

      const { text, language, count, tone, niche } = validation.data;
      
      const result = await TextController.captionService.generateCaptions(
        text,
        language,
        count,
        tone,
        niche
      );

      if (!Array.isArray(result)) {
        throw new HTTPError('Invalid response format from AI service', 500);
      }

      res.json({
        success: true,
        captions: result.map((content: string, id: number) => ({ id, content, type: 'text' }))
      });
    } catch (error) {
      next(error);
    }
  }

  static async generateTextScript(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = textScriptSchema.safeParse(req.body);
      if (!validation.success) {
        throw new HTTPError('Invalid script request parameters', 400);
      }

      const { text, language, tone, niche } = validation.data;
      
      const result = await TextController.scriptService.generateScript(
        text,
        language,
        tone,
        niche
      );

      if (!('scenes' in result)) {
        throw new HTTPError('Invalid script structure received from AI service', 500);
      }

      res.json({
        success: true,
        script: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async generateCombinedText(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = textCombinedSchema.safeParse(req.body);
      if (!validation.success) {
        throw new HTTPError('Invalid combined request parameters', 400);
      }

      const { text, language, count, tone, niche } = validation.data;
      
      const result = await TextController.unifiedService.generateBoth(
        text,
        language,
        count,
        tone,
        niche
      );

      res.json({
        success: true,
        captions: result.captions.map((content, id) => ({ id, content, type: 'text' })),
        script: result.script
      });
    } catch (error) {
      next(error);
    }
  }
}

export { 
  textCaptionsSchema,
  textScriptSchema,
  textCombinedSchema 
};

export const generateTextCaptions = TextController.generateTextCaptions;
export const generateTextScript = TextController.generateTextScript;
export const generateCombinedText = TextController.generateCombinedText;