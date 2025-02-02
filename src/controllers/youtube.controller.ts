import { Request, Response, NextFunction } from 'express';
import { YoutubeTranscript } from 'youtube-transcript';
import { HTTPError } from '../utils/errors';
import { z } from 'zod';
import { AIService } from '../services/ai.service';
import { ScriptStructure } from '../types/script';
import { logger } from '../utils/logger';

export const transcriptSchema = z.object({
  url: z.string().url()
});

export const youtubeCaptionsSchema = z.object({
  url: z.string().url(),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']),
  count: z.number().int().min(1).max(5).optional().default(1)
});

export const youtubeScriptSchema = z.object({
  url: z.string().url(),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']).optional()
});

export class YoutubeController {
  private static aiService = new AIService();

  static async getTranscript(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('🎥 Starting YouTube transcript fetch');
      const validation = transcriptSchema.safeParse(req.body);
      if (!validation.success) {
        logger.warn('❌ Invalid YouTube URL provided');
        throw new HTTPError('Invalid YouTube URL', 400);
      }

      logger.info(`🔗 Extracting video ID from URL: ${validation.data.url}`);
      const videoId = YoutubeController.extractVideoId(validation.data.url);
      logger.info(`📹 Fetching transcript for video ID: ${videoId}`);

      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId)
        .catch((error) => {
          logger.error('❌ Transcript fetch failed:', error);
          throw new HTTPError(`Failed to fetch transcript: ${error.message}`, 500);
        });
      
      logger.info(`✅ Successfully fetched transcript with ${transcriptItems.length} items`);
      res.json({
        transcript: transcriptItems.map(item => item.text).join(' ')
      });
    } catch (error) {
      logger.error('❌ Transcript fetch error:', error);
      next(error);
    }
  }

  static async generateYouTubeCaptions(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('🎬 Starting YouTube caption generation');
      const validation = youtubeCaptionsSchema.safeParse(req.body);
      if (!validation.success) {
        logger.warn('❌ Invalid request parameters');
        throw new HTTPError('Invalid YouTube URL or language', 400);
      }

      logger.info(`🔗 Processing video URL: ${validation.data.url}`);
      const videoId = YoutubeController.extractVideoId(validation.data.url);
      logger.info(`📹 Fetching transcript for video ID: ${videoId}`);
      
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      logger.info(`📝 Got ${transcriptItems.length} transcript items`);
      
      const transcript = transcriptItems.map(item => item.text).join(' ');
      logger.info(`📊 Combined transcript length: ${transcript.length} characters`);
      
      logger.info('🤖 Generating captions with AI');
      const captions = await YoutubeController.aiService.generateContent(
        'captions',
        transcript,
        validation.data.language,
        validation.data.count
      ) as string[];

      logger.info(`✨ Generated ${captions.length} captions`);
      res.json({
        success: true,
        captions: captions.map((content: string, id: number) => ({ id, content, type: 'text' }))
      });
    } catch (error) {
      logger.error('❌ Caption generation error:', error);
      next(error);
    }
  }

  static async generateYouTubeScript(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('📝 Starting YouTube script generation');
      const validation = youtubeScriptSchema.safeParse(req.body);
      if (!validation.success) {
        logger.warn('❌ Invalid request parameters');
        throw new HTTPError('Invalid YouTube URL or language', 400);
      }

      logger.info(`🔗 Processing video URL: ${validation.data.url}`);
      const videoId = YoutubeController.extractVideoId(validation.data.url);
      logger.info(`📹 Fetching transcript for video ID: ${videoId}`);
      
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      logger.info(`📝 Got ${transcriptItems.length} transcript items`);
      
      const transcript = transcriptItems.map(item => item.text).join(' ');
      logger.info(`📊 Combined transcript length: ${transcript.length} characters`);
      
      logger.info('🤖 Generating script with AI');
      const script = await YoutubeController.aiService.generateContent(
        'script',
        transcript,
        validation.data.language,
        1
      ) as ScriptStructure;

      logger.info(`✨ Generated script with ${script.scenes?.length || 0} scenes`);
      res.json({
        success: true,
        script
      });
    } catch (error) {
      logger.error('❌ Script generation error:', error);
      next(error);
    }
  }

  private static extractVideoId(url: string): string {
    logger.debug(`🔍 Extracting video ID from URL: ${url}`);
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    if (match?.[7]?.length === 11) {
      logger.debug(`✅ Successfully extracted video ID: ${match[7]}`);
      return match[7];
    }
    logger.warn('❌ Failed to extract video ID from URL');
    throw new HTTPError('Invalid YouTube URL', 400);
  }

  static async getYouTubeTranscript(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { url } = req.body;
      const transcript = await YoutubeTranscript.fetchTranscript(url);
      res.json({ transcript });
    } catch (error) {
      next(new HTTPError('Failed to fetch transcript', 500));
    }
  }
}

export const getYouTubeTranscript = YoutubeController.getTranscript;
export const generateYouTubeCaptions = YoutubeController.generateYouTubeCaptions;
export const generateYouTubeScript = YoutubeController.generateYouTubeScript; 