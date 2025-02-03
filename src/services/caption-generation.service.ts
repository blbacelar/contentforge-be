import { BaseAIService } from './base-ai.service';
import { LANGUAGE_CODES, LANGUAGES } from '../types/language';
import { prompts } from '../config/prompts';
import { logger } from '../utils/logger';
import { HTTPError } from '../utils/errors';

export class CaptionGenerationService extends BaseAIService {
  async generateCaptions(
    content: string,
    language: LANGUAGE_CODES = 'en-US',
    count: number = 1,
    tone: string = 'Casual',
    niche: string = 'general'
  ): Promise<string[]> {
    try {
      logger.info('Starting caption generation', { 
        contentLength: content.length,
        language,
        count,
        tone,
        niche 
      });

      const { systemPrompt, userPrompt } = this.getPrompts(content, language, count, tone, niche);
      const responseText = await this.makeAIRequest(systemPrompt, userPrompt);

      return this.processCaptions(responseText, count);
    } catch (error) {
      logger.error('Caption generation error:', error);
      throw new HTTPError(
        `Caption generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  public processCaptions(responseText: string, count: number): string[] {
    try {
      logger.debug('Processing captions from response:', { responseText });
      
      const rawCaptions = responseText.split('\n')
        .map(line => line
          .replace(/^["\d.\-)]+\s*/, '')  // Remove numbering
          .replace(/\s{2,}/g, ' ')        // Normalize spaces
          .trim())
        .filter(line => line.length >= 5); // Remove empty/short lines
      
      logger.debug('Processed raw captions:', { rawCaptions });
      
      if (rawCaptions.length === 0) {
        throw new Error('No valid captions were generated');
      }

      if (rawCaptions.length < count) {
        logger.warn('Insufficient captions generated', {
          expected: count,
          received: rawCaptions.length
        });
        throw new Error(`Only generated ${rawCaptions.length}/${count} captions`);
      }

      return rawCaptions.slice(0, count);
    } catch (error) {
      logger.error('Caption processing error:', { 
        error,
        responseText
      });
      throw error;
    }
  }

  protected getPrompts(content: string, language: LANGUAGE_CODES, count: number, tone: string, niche: string) {
    const langConfig = LANGUAGES[language];
    if (!langConfig?.systemPrompt) {
      throw new HTTPError(`Unsupported language: ${language}`, 400);
    }

    const typePrompts = prompts.captions;
    return {
      systemPrompt: typePrompts.system(langConfig.systemPrompt, count, tone, niche),
      userPrompt: typePrompts.user(content, count, tone, niche)
    };
  }
} 