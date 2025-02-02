import { HTTPError } from '../utils/errors';
import { prompts, PromptType } from '../config/prompts';
import { LANGUAGE_CODES, LANGUAGES } from '../types/language';
import { ScriptStructure } from '../types/script';

export class AIService {
  private readonly DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

  async generateContent(
    type: PromptType,
    content: string,
    language: LANGUAGE_CODES = 'en-US',
    count: number = 1
  ): Promise<string[] | ScriptStructure> {
    const finalCount = type === 'script' ? 1 : count;
    if (!content || content.length < 50) {
      throw new HTTPError('Insufficient content for generation', 400);
    }
    try {
      const { systemPrompt, userPrompt } = this.getPrompts(type, content, language, finalCount);
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

      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
      
      const data = await response.json();
      const responseText = data.choices[0]?.message?.content?.trim() || '';

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

      const rawCaptions = responseText.split('\n')
        .map((c: string) => 
          c.replace(/^["\d.]+[\s)]*/, '')
           .replace(/\s{2,}/g, ' ')
           .trim()
        )
        .filter((c: string) => c.length > 0 && !c.startsWith('Caption'));
      
      return rawCaptions.slice(0, finalCount);
    } catch (error) {
      throw new HTTPError('AI generation failed', 500);
    }
  }

  private getPrompts(type: PromptType, content: string, language: LANGUAGE_CODES, count: number) {
    if (type === 'captions') {
      return {
        systemPrompt: prompts[type].system(LANGUAGES[language].systemPrompt, count),
        userPrompt: prompts[type].user(content, count)
      };
    }
    
    if (type === 'script') {
      return {
        systemPrompt: prompts[type].system(LANGUAGES[language].systemPrompt),
        userPrompt: prompts[type].user(content)
      };
    }

    return {
      systemPrompt: prompts[type].system(LANGUAGES[language].systemPrompt),
      userPrompt: prompts[type].user(content)
    };
  }
} 