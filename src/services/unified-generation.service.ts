import { BaseAIService } from './base-ai.service';
import { ScriptStructure } from '../types/script';
import { logger } from '../utils/logger';
import { HTTPError } from '../utils/errors';
import { LANGUAGE_CODES } from '../types/language';
import { prompts } from '../config/prompts';
import { CaptionGenerationService } from './caption-generation.service';
import { ScriptGenerationService } from './script-generation.service';

type UnifiedResponse = {
  captions: string[];
  script: ScriptStructure;
};

export class UnifiedGenerationService extends BaseAIService {
  private captionService = new CaptionGenerationService();
  private scriptService = new ScriptGenerationService();

  async generateBoth(
    content: string,
    language: LANGUAGE_CODES = 'en-US',
    count: number = 1,
    tone: string = 'Casual',
    niche: string = 'general'
  ): Promise<UnifiedResponse> {
    try {
      logger.info('Starting combined generation:', {
        contentLength: content.length,
        language,
        count,
        tone,
        niche
      });

      // Get existing prompts from config
      const captionPrompts = prompts.captions;
      const scriptPrompts = prompts.script;

      // Combine system prompts
      const systemPrompt = `${captionPrompts.system(language, count, tone, niche)}\n\n${
        scriptPrompts.system(language, tone, niche)
      }\n\nIMPORTANT: Return BOTH captions and script in this JSON format:
      {
        "captions": ["caption1", "caption2"],
        "script": { ...script structure... }
      }`;

      // Combine user prompts
      const userPrompt = `${captionPrompts.user(content, count, tone, niche)}\n\n${
        scriptPrompts.user(content, tone, niche)
      }`;

      const responseText = await this.makeAIRequest(systemPrompt, userPrompt, true);
      
      // Parse combined response
      const parsedResponse = JSON.parse(responseText);
      
      // Use existing validation from individual services
      const captions = Array.isArray(parsedResponse.captions) 
        ? parsedResponse.captions
            .map((c: string) => String(c).trim())
            .filter((c: string) => c.length >= 5)
            .slice(0, count)
        : this.captionService.processCaptions(JSON.stringify(parsedResponse.captions), count);
      
      const script = this.scriptService.parseScript(JSON.stringify(parsedResponse.script));

      return { captions, script };
    } catch (error) {
      logger.error('Combined generation failed:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      throw new HTTPError(
        `Combined generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }
} 