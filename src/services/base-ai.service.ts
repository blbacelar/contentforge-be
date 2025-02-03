import OpenAI from 'openai';
import { LANGUAGE_CODES, LANGUAGES } from '../types/language';
import { prompts } from '../config/prompts';
import { logger } from '../utils/logger';
import { HTTPError } from '../utils/errors';

export class BaseAIService {
  private readonly DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

  protected async makeAIRequest(systemPrompt: string, userPrompt: string, isScript: boolean = false): Promise<string> {
    try {
      logger.debug('Making AI request', {
        systemPromptPreview: systemPrompt.substring(0, 100) + '...',
        userPromptPreview: userPrompt.substring(0, 100) + '...',
        isScript
      });

      // For scripts, ensure we get JSON
      const finalSystemPrompt = isScript 
        ? `${systemPrompt}\nIMPORTANT: You must respond with valid JSON only, no additional text or markdown formatting.`
        : systemPrompt;

      const response = await fetch(this.DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
          messages: [
            { role: 'system', content: finalSystemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: isScript ? 0.2 : 0.7,
          max_tokens: 2000
        })
      });

      let responseText = '';
      try {
        // First check if response is OK before parsing
        if (!response.ok) {
          const errorText = await response.text();
          logger.error('API error response:', {
            status: response.status,
            statusText: response.statusText,
            errorText
          });
          throw new Error(`API request failed: ${response.statusText} - ${errorText}`);
        }

        const data = await response.json();
        logger.debug('Raw API Response:', {
          fullResponse: JSON.stringify(data),
          isScript
        });

        responseText = data.choices?.[0]?.message?.content?.trim();

        // Handle empty response even when status is OK
        if (!responseText) {
          logger.error('Empty response content', { data });
          throw new Error('Received empty response from AI service');
        }

        // For scripts, try to extract JSON if it's wrapped in markdown
        if (isScript) {
          let potentialJson = responseText;
          
          // First try direct parse
          try {
            JSON.parse(potentialJson);
          } catch (initialError) {
            // If direct parse fails, try extracting code blocks
            const codeBlockMatch = potentialJson.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (codeBlockMatch) {
              potentialJson = codeBlockMatch[1].trim();
            }

            // Try parsing again after extraction
            try {
              JSON.parse(potentialJson);
            } catch (finalError) {
              // If still failing, look for complete JSON object
              const jsonObjectMatch = potentialJson.match(/(\{[\s\S]*\})/);
              if (jsonObjectMatch) {
                potentialJson = jsonObjectMatch[1].trim();
              }
            }
          }

          // Final validation with better error reporting
          try {
            const parsed = JSON.parse(potentialJson);
            responseText = JSON.stringify(parsed); // Normalize JSON
          } catch (jsonError) {
            logger.error('Invalid JSON in script response:', { 
              original: responseText,
              processed: potentialJson,
              error: jsonError 
            });
            throw new Error('Invalid JSON format in script response');
          }
        }

      } catch (parseError) {
        logger.error('Response parsing error:', {
          error: parseError,
          responseText,
          status: response.status
        });
        throw new Error(`Failed to parse API response: ${
          parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        }`);
      }

      logger.debug('AI response received', { 
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 100) + '...',
        isScript
      });

      return responseText;
    } catch (error: unknown) {
      logger.error('Deepseek API error:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      throw new HTTPError(
        `AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  protected getPrompts(content: string, language: LANGUAGE_CODES, count: number, tone: string, niche: string) {
    try {
      const langConfig = LANGUAGES[language];
      if (!langConfig?.systemPrompt) {
        logger.error('Language configuration error:', { language });
        throw new HTTPError(`Unsupported language: ${language}`, 400);
      }

      const typePrompts = prompts.captions;
      const systemPrompt = typePrompts.system(langConfig.systemPrompt, count, tone, niche);
      const userPrompt = typePrompts.user(content, count, tone, niche);

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