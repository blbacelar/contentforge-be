import { BaseAIService } from './base-ai.service';
import { LANGUAGE_CODES, LANGUAGES } from '../types/language';
import { prompts } from '../config/prompts';
import { ScriptStructure } from '../types/script';
import { logger } from '../utils/logger';
import { HTTPError } from '../utils/errors';

export class ScriptGenerationService extends BaseAIService {
  async generateScript(
    content: string,
    language: LANGUAGE_CODES = 'en-US',
    tone: string = 'Casual',
    niche: string = 'general'
  ): Promise<ScriptStructure> {
    try {
      logger.info('Starting script generation:', { 
        contentLength: content.length,
        language,
        tone,
        niche 
      });

      const { systemPrompt, userPrompt } = this.getPrompts(content, language, 0, tone, niche);
      
      logger.debug('Generated prompts:', {
        systemPromptPreview: systemPrompt.substring(0, 100) + '...',
        userPromptPreview: userPrompt.substring(0, 100) + '...'
      });

      const responseText = await this.makeAIRequest(systemPrompt, userPrompt, true);
      logger.debug('Raw AI Response:', { responseText });

      return this.parseScript(responseText);
    } catch (error) {
      logger.error('Script generation failed:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  public parseScript(responseText: string): ScriptStructure {
    try {
      if (!responseText) {
        logger.error('Empty response received from AI');
        throw new Error('Empty response from AI service');
      }

      logger.debug('Starting script parsing. Raw response:', { 
        responseText,
        responseLength: responseText.length 
      });
      
      // Clean up the response text
      let cleanedJson = responseText
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/(\r\n|\n|\r)/gm, ' ')
        .trim();
      
      logger.debug('After initial cleanup:', { 
        cleanedJson,
        cleanedLength: cleanedJson.length 
      });

      // Try to find JSON content between curly braces
      const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.error('No JSON object found in cleaned response:', { cleanedJson });
        throw new Error('Invalid script format: No JSON object found');
      }

      cleanedJson = jsonMatch[0];
      logger.debug('Extracted JSON match:', { 
        cleanedJson,
        matchLength: cleanedJson.length 
      });

      // Parse and validate script structure
      const parsedScript: ScriptStructure = JSON.parse(cleanedJson);
      
      if (parsedScript.scenes) {
        // Already has scenes, no need to assign
      } else {
        logger.error('Invalid script structure:', { parsedScript });
        throw new Error('Invalid script structure: missing scenes array');
      }

      if (!Array.isArray(parsedScript.scenes)) {
        logger.error('Invalid scenes format:', { scenes: parsedScript.scenes });
        throw new Error('Invalid script structure: scenes must be an array');
      }

      return parsedScript;
    } catch (error) {
      logger.error('Script parsing error:', {
        responseText,
        error,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to parse script response');
    }
  }

  protected getPrompts(content: string, language: LANGUAGE_CODES, count: number, tone: string, niche: string) {
    try {
      const langConfig = LANGUAGES[language];
      if (!langConfig?.systemPrompt) {
        logger.error('Language configuration error:', { language, availableLanguages: Object.keys(LANGUAGES) });
        throw new HTTPError(`Unsupported language: ${language}`, 400);
      }

      const typePrompts = prompts.script;
      const systemPrompt = typePrompts.system(langConfig.systemPrompt, tone, niche);
      const userPrompt = typePrompts.user(content, tone, niche);

      logger.debug('Generated prompts:', {
        language,
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length
      });

      return { systemPrompt, userPrompt };
    } catch (error) {
      logger.error('Prompt generation error:', {
        error,
        language,
        content: content.substring(0, 100) + '...'
      });
      throw error;
    }
  }
} 