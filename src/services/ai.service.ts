import { HTTPError } from '../utils/errors';
import { prompts, PromptType } from '../config/prompts';
import { LANGUAGE_CODES, LANGUAGES } from '../types/language';
import { ScriptStructure } from '../types/script';
import { logger } from '../utils/logger';

export class AIService {
  private readonly DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

  async generateContent(
    type: PromptType,
    content: string,
    language: LANGUAGE_CODES = 'en-US',
    count: number = 1,
    tone: string = 'Casual',
    niche: string = 'general'

  ): Promise<string[] | ScriptStructure> {
    const finalCount = type === 'script' ? 1 : count;
    if (!content || content.length < 50) {
      throw new HTTPError('Insufficient content for generation', 400);
    }
    try {
      const { systemPrompt, userPrompt } = this.getPrompts(type, content, language, finalCount, tone, niche);
      logger.info(`Generating ${type} with prompt:`, { systemPrompt, userPrompt });

      const response = await fetch(this.DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{
            role: 'user',
            content: systemPrompt + userPrompt
          }],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('API Response Error:', { status: response.status, data: errorData });
        throw new Error(`API error: ${response.statusText} - ${errorData}`);
      }
      
      const data = await response.json();
      const responseText = data.choices[0]?.message?.content?.trim() || '';
      logger.info('AI Response:', { responseText });

      if (type === 'script') {
        let cleanedJson = responseText;
        try {
          // Remove markdown code blocks
          cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
          return JSON.parse(cleanedJson) as ScriptStructure;
        } catch (error) {
          console.error('Script JSON Parse Error:', error);
          console.error('Cleaned Response:', cleanedJson);
          throw new HTTPError('Failed to parse script JSON', 500);
        }
      }

      // Caption processing
      logger.info('Processing captions from response');
      const rawCaptions = responseText.split('\n')
        .map((c: string) => {
          const processed = c.replace(/^["\d.]+[\s)]*/, '')
            .replace(/\s{2,}/g, ' ')
            .trim();
          logger.debug('Processed caption:', { original: c, processed });
          return processed;
        })
        .filter((c: string) => {
          const isValid = c.length > 0 && !c.startsWith('Caption');
          if (!isValid) {
            logger.debug('Filtered out caption:', { caption: c });
          }
          return isValid;
        });
      
      const finalCaptions = rawCaptions.slice(0, finalCount);
      logger.info(`Generated ${finalCaptions.length} captions`);
      
      if (finalCaptions.length === 0) {
        throw new Error('No valid captions were generated from the response');
      }

      return finalCaptions;
    } catch (error) {
      logger.error('AI generation error:', error);
      if (error instanceof Error) {
        throw new HTTPError(`AI generation failed: ${error.message}`, 500);
      }
      throw new HTTPError('AI generation failed due to an unexpected error', 500);
    }
  }

  private getPrompts(type: PromptType, content: string, language: LANGUAGE_CODES, count: number, tone: string, niche: string) {
    if (type === 'captions') {
      return {
        systemPrompt: prompts[type].system(LANGUAGES[language].systemPrompt, count, tone, niche),
        userPrompt: prompts[type].user(content, count, tone, niche)
      };
    }
    
    if (type === 'script') {
      return {
        systemPrompt: prompts[type].system(LANGUAGES[language].systemPrompt, tone, niche),
        userPrompt: prompts[type].user(content, tone, niche)
      };
    }

    return {
      systemPrompt: prompts[type].system(LANGUAGES[language].systemPrompt, tone, niche),
      userPrompt: prompts[type].user(content, tone, niche)
    };
  }

  async checkAPIHealth(timeout = 2000): Promise<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(this.DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{
            role: 'user',
            content: 'Ping'
          }],
          max_tokens: 1,
          temperature: 0
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.error('Deepseek API Health Check Failed:', response.status);
        return 'unhealthy';
      }

      return 'healthy';
    } catch (error) {
      logger.error('Deepseek API Health Check Error:', error instanceof Error ? error : new Error(String(error)));
      if (error instanceof Error && error.name === 'AbortError') {
        return 'timeout';
      }
      return 'unreachable';
    }
  }
} 