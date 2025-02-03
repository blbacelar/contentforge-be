import { AIService } from './ai.service';
import { PromptType } from '../types/prompts';
import { LANGUAGE_CODES } from '../types/language';
import { ScriptStructure } from '../types/script';
import { logger } from '../utils/logger';
import { HTTPError } from '../utils/errors';

export class ContentGenerationService {
  private static instance: ContentGenerationService;
  private aiService: AIService;

  private constructor() {
    this.aiService = new AIService();
  }

  public static getInstance(): ContentGenerationService {
    if (!ContentGenerationService.instance) {
      ContentGenerationService.instance = new ContentGenerationService();
    }
    return ContentGenerationService.instance;
  }

  async generateContent(params: {
    type: PromptType;
    content: string;
    language: LANGUAGE_CODES;
    count?: number;
    tone?: string;
    niche?: string;
  }): Promise<string[] | ScriptStructure> {
    try {
      const { type, content, language, count = 1, tone = 'Casual', niche = 'general' } = params;
      
      logger.info(`Generating ${type} content`, { language, count, tone, niche });
      
      const result = await this.aiService.generateContent(
        type,
        content,
        language,
        count,
        tone,
        niche
      );

      if (!result) {
        throw new Error('No content generated');
      }

      return result;
    } catch (error) {
      logger.error('Content generation failed:', error);
      throw new HTTPError(
        `Failed to generate ${params.type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }
}