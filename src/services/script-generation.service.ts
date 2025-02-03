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

      const { systemPrompt, userPrompt } = this.getPrompts(content, language, 1, tone, niche);
      
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

  private parseScript(responseText: string): ScriptStructure {
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

      try {
        const parsedScript = JSON.parse(cleanedJson);
        logger.debug('Successfully parsed JSON:', { 
          hasScenes: !!parsedScript.scenes,
          scenesIsArray: Array.isArray(parsedScript.scenes),
          sceneCount: parsedScript.scenes?.length
        });

        // Validate script structure
        if (!parsedScript.scenes || !Array.isArray(parsedScript.scenes)) {
          logger.error('Invalid script structure:', { parsedScript });
          throw new Error('Invalid script structure: missing or invalid scenes array');
        }

        // Log each scene structure
        parsedScript.scenes.forEach((scene: any, index: number) => {
          logger.debug(`Validating scene ${index + 1}:`, {
            sceneId: scene.sceneId,
            type: scene.type,
            hasVisual: !!scene.visual,
            hasNarration: !!scene.narration
          });

          if (!scene.sceneId || !scene.type || !scene.visual || !scene.narration) {
            logger.error(`Invalid scene at index ${index}:`, { scene });
            throw new Error(`Invalid scene structure at position ${index + 1}`);
          }
        });

        return parsedScript;
      } catch (parseError) {
        logger.error('JSON Parse Error:', { 
          error: parseError,
          cleanedJson,
          errorMessage: parseError instanceof Error ? parseError.message : String(parseError)
        });
        throw parseError;
      }
    } catch (error) {
      logger.error('Script parsing error:', { 
        error,
        responseText,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
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