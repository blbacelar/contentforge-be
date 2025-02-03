import { Request, Response, NextFunction } from 'express';
import { HTTPError } from '../utils/errors';
import { CaptionGenerationService } from '../services/caption-generation.service';
import { ScriptGenerationService } from '../services/script-generation.service';
import { ScriptStructure } from '../types/script';
import { logger } from '../utils/logger';
import { textCaptionsSchema, textScriptSchema, textCombinedSchema } from '../config/schemas';

export class TextController {
  private static captionService = new CaptionGenerationService();
  private static scriptService = new ScriptGenerationService();

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
      logger.info('Starting combined text generation');
      const validation = textCombinedSchema.safeParse(req.body);
      if (!validation.success) {
        logger.warn('Invalid request parameters:', validation.error);
        throw new HTTPError('Invalid text input for combined generation', 400);
      }

      const { text, language, count, tone, niche } = validation.data;
      logger.info('Generating combined content', { language, count, tone, niche });
      
      try {
        const [captions, script] = await Promise.all([
          TextController.captionService.generateCaptions(
            text,
            language,
            count,
            tone,
            niche
          ),
          TextController.scriptService.generateScript(
            text,
            language,
            tone,
            niche
          )
        ]);

        if (!Array.isArray(captions) || !script?.scenes) {
          logger.error('Invalid response format:', { captions, script });
          throw new Error('Invalid response format from generation services');
        }

        logger.info('Successfully generated combined content', {
          captionsCount: captions.length,
          scenesCount: script.scenes.length
        });

        res.json({
          success: true,
          captions: captions.map((content, id) => ({ id, content, type: 'text' })),
          script
        });
      } catch (genError) {
        logger.error('Content generation failed:', genError);
        throw new HTTPError(
          `Failed to generate content: ${genError instanceof Error ? genError.message : 'Unknown error'}`,
          500
        );
      }
    } catch (error) {
      logger.error('Combined generation error:', error);
      next(error);
    }
  }
}

export const generateTextCaptions = TextController.generateTextCaptions;
export const generateTextScript = TextController.generateTextScript;
export const generateCombinedText = TextController.generateCombinedText;