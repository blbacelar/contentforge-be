import { Request, Response, NextFunction } from 'express';
import { YoutubeTranscript } from 'youtube-transcript';
import { HTTPError } from '../utils/errors';
import { z } from 'zod';
import { AIService } from '../services/ai.service';
import { ScriptStructure } from '../types/script';
import { logger } from '../utils/logger';
import { TONES } from '../config/tones';
import { CaptionGenerationService } from '../services/caption-generation.service';
import { ScriptGenerationService } from '../services/script-generation.service';

export const transcriptSchema = z.object({
  url: z.string().url()
});

export const youtubeCaptionsSchema = z.object({
  url: z.string().url(),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']),
  count: z.number().int().min(1).max(5).optional().default(1),
  tone: z.enum(TONES).optional().default('Casual'),
  niche: z.string().min(3).max(50).optional().default('general')
});

export const youtubeScriptSchema = z.object({
  url: z.string().url(),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']).optional().default('en-US'),
  tone: z.enum(TONES).optional().default('Casual'),
  niche: z.string().min(3).max(50).optional().default('general')
});

export const youtubeCombinedSchema = youtubeCaptionsSchema.merge(youtubeScriptSchema).extend({
  url: z.string().url(),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']),
  count: z.number().int().min(1).max(5).optional().default(1)
});

export class YoutubeController {
  private static aiService = new AIService();
  private static captionService = new CaptionGenerationService();
  private static scriptService = new ScriptGenerationService();

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
      const { language, count, tone, niche } = validation.data;

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
        language,
        count,
        tone,
        niche

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
      const { language, tone, niche } = validation.data;
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
        language,
        1,
        tone,
        niche

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
  

  static async generateCombinedYouTube(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('🎬 Starting YouTube combined generation');
      const validation = youtubeCombinedSchema.safeParse(req.body);
      if (!validation.success) {
        logger.warn('❌ Invalid request parameters');
        throw new HTTPError('Invalid YouTube URL or language', 400);
      }

      const { language, count, tone, niche } = validation.data;
      const videoId = YoutubeController.extractVideoId(validation.data.url);
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      const transcript = transcriptItems.map(item => item.text).join(' ');
      
      const [captions, script] = await Promise.all([
        YoutubeController.captionService.generateCaptions(
          transcript,
          language,
          count,
          tone,
          niche
        ),
        YoutubeController.scriptService.generateScript(
          transcript,
          language,
          tone,
          niche
        )
      ]);

      res.json({
        success: true,
        captions: captions.map((content, id) => ({ id, content, type: 'text' })),
        script
      });
    } catch (error) {
      logger.error('YouTube combined generation error:', error);
      next(new HTTPError('Failed to generate combined YouTube content', 500));
    }
  }

  static async getYouTubeTranscript(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      logger.info('🎥 Starting YouTube transcript fetch');
      const validation = transcriptSchema.safeParse(req.body);
      if (!validation.success) {
        logger.warn('❌ Invalid YouTube URL provided', { errors: validation.error.errors });
        throw new HTTPError('Invalid YouTube URL format', 400);
      }

      logger.info(`🔗 Extracting video ID from URL: ${validation.data.url}`);
      const videoId = YoutubeController.extractVideoId(validation.data.url);
      
      logger.info(`📹 Attempting transcript fetch for video ID: ${videoId}`);
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId)
        .then(items => {
          if (items.length === 0) {
            logger.warn('⚠️ Empty transcript received', { videoId });
            throw new HTTPError('No transcript available for this video', 404);
          }
          return items;
        })
        .catch((error: Error) => {
          logger.error('❌ Transcript fetch failed', { 
            videoId,
            error: error.message,
            stack: error.stack 
          });
          
          // Handle specific error cases
          if (error.message.includes("Transcript is disabled")) {
            throw new HTTPError('Transcripts are disabled for this video', 400);
          }
          if (error.message.includes("Could not retrieve a transcript")) {
            throw new HTTPError('No transcript available for this video', 404);
          }
          throw new HTTPError(`Failed to fetch transcript: ${error.message}`, 500);
        });

      logger.info(`✅ Successfully fetched ${transcriptItems.length} transcript items`);
      res.json({
        success: true,
        videoId,
        transcript: transcriptItems.map(item => item.text).join(' '),
        duration: transcriptItems[transcriptItems.length - 1].offset
      });
    } catch (error) {
      logger.error('❌ Transcript endpoint error', {
        body: req.body,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      next(error);
    }
  }

  private static extractVideoId(url: string): string {
    logger.debug(`🔍 Extracting video ID from URL: ${url}`);
    const patterns = [
      /(?:v=|\/v\/|^youtu\.be\/|embed\/|shorts\/)([^&\n?#]+)/, // Improved regex pattern
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID match
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]?.length === 11) {
        const videoId = match[1];
        logger.debug(`✅ Extracted video ID: ${videoId}`);
        return videoId;
      }
    }

    logger.warn('❌ Failed to extract video ID', { url });
    throw new HTTPError('Invalid YouTube URL format', 400);
  }
}

export const getYouTubeTranscript = YoutubeController.getYouTubeTranscript;
export const generateYouTubeCaptions = YoutubeController.generateYouTubeCaptions;
export const generateYouTubeScript = YoutubeController.generateYouTubeScript;
export const generateCombinedYouTube = YoutubeController.generateCombinedYouTube; 