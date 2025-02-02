import { Request, Response, NextFunction } from 'express';
import { PdfService } from '../services/pdf.service';
import { HTTPError } from '../utils/errors';
import { z } from 'zod';
import { AIService } from '../services/ai.service';
import { ScriptStructure } from '../types/script';
import { logger } from '../utils/logger';
import { TONES } from '../config/tones';

export const pdfSchema = z.object({
  pdfUrl: z.string().url(),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']).optional().default('en-US'),
  tone: z.enum(['casual', 'formal', 'humorous', 'inspirational', 'professional']).optional().default('casual'),
  niche: z.string().min(3).max(50).optional().default('general')
});


export const cloudinaryPdfSchema = z.object({
  publicId: z.string()
});

export const pdfCaptionsSchema = z.object({
  pdfUrl: z.string().url(),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']),
  count: z.number().int().min(1).max(5).optional().default(1),
  tone: z.enum(['casual', 'formal', 'humorous', 'inspirational', 'professional']).optional().default('casual'),
  niche: z.string().min(3).max(50).optional().default('general')
});


export const cloudinaryCaptionsSchema = z.object({
  publicId: z.string(),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']),
  count: z.number().int().min(1).max(5).optional().default(1),
  tone: z.enum(['casual', 'formal', 'humorous', 'inspirational', 'professional']).optional().default('casual'),
  niche: z.string().min(3).max(50).optional().default('general')
});


export const pdfScriptSchema = z.object({
  pdfUrl: z.string().url(),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']),
  tone: z.enum(TONES).optional().default('Casual'),
  niche: z.string().min(3).max(50).optional().default('general')
});


export class PdfController {
  private static pdfService = new PdfService();
  private static aiService = new AIService();

  static async processPdf(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('🔍 Validating request body');
      const validation = pdfSchema.safeParse(req.body);
      if (!validation.success) {
        logger.warn('❌ Invalid PDF URL provided');
        throw new HTTPError('Invalid PDF URL', 400);
      }

      logger.info(`🌐 Starting PDF fetch from: ${validation.data.pdfUrl}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        logger.warn('⏱️ PDF fetch timeout');
      }, 30000);
      
      const response = await fetch(validation.data.pdfUrl, { 
        signal: controller.signal,
        headers: { 'User-Agent': 'ContentForge/1.0' }
      });
      clearTimeout(timeoutId);
      logger.info(`📥 PDF fetch completed with status: ${response.status}`);

      if (!response.ok) {
        logger.error(`❌ PDF fetch failed - Status: ${response.status}`);
        throw new HTTPError(`Failed to fetch PDF (Status ${response.status})`, 400);
      }

      const contentType = response.headers.get('content-type');
      logger.info(`🏷️ Content-Type: ${contentType}`);

      if (!contentType?.includes('application/pdf')) {
        logger.warn('❌ Invalid content type');
        throw new HTTPError('URL does not point to a PDF file', 400);
      }

      logger.info('📦 Creating buffer from response');
      const buffer = Buffer.from(await response.arrayBuffer());
      logger.info(`📊 Buffer size: ${buffer.length} bytes`);

      logger.info('🔄 Starting PDF processing');
      const processedContent = await PdfController.pdfService.processPdf(buffer);
      logger.info(`✅ PDF processing completed with ${processedContent.length} items`);

      res.json({
        content: processedContent.map((text: string, id: number) => ({ id, content: text, type: 'text' }))
      });
    } catch (error) {
      logger.error('❌ PDF processing error:', error);
      next(error);
    }
  }

  static async processCloudinaryPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = cloudinaryPdfSchema.safeParse(req.body);
      if (!validation.success) {
        throw new HTTPError('Invalid Cloudinary public ID', 400);
      }
      
      const captions = await PdfController.pdfService.processCloudinaryPdf(validation.data.publicId);
      
      res.json({
        captions: captions.map((content, id) => ({ id, content, type: 'text' }))
      });
    } catch (error) {
      next(error);
    }
  }

  static async generateCaptionsFromPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = pdfCaptionsSchema.safeParse(req.body);
      if (!validation.success) {
        throw new HTTPError('Invalid request parameters', 400);
      }

      const buffer = await PdfController.fetchPdfBuffer(validation.data.pdfUrl);
      const fullText = await PdfController.pdfService.extractFullText(buffer);
      
      if (fullText.length < 100) {
        throw new HTTPError('PDF content is too short for caption generation', 400);
      }

      const captions = await PdfController.aiService.generateContent(
        'captions',
        fullText,
        validation.data.language,
        validation.data.count
      ) as string[];

      res.json({
        success: true,
        captions: captions.map((content: string, id: number) => ({ id, content, type: 'text' }))
      });
    } catch (error) {
      console.error('PDF Caption Generation Error:', error);
      next(new HTTPError('Failed to generate captions from PDF', 500));
    }
  }

  static async generateScriptFromPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = pdfScriptSchema.safeParse(req.body);
      if (!validation.success) {
        throw new HTTPError('Invalid request parameters', 400);
      }

      const buffer = await PdfController.fetchPdfBuffer(validation.data.pdfUrl);
      const fullText = await PdfController.pdfService.extractFullText(buffer);
      const { language, tone, niche } = validation.data;
      
      if (fullText.length < 250) {
        throw new HTTPError('PDF content is too short for meaningful script generation', 400);
      }

      const script = await PdfController.aiService.generateContent(
        'script',
        fullText,
        language,
        1,
        tone,
        niche

      ) as ScriptStructure;


      if (!script?.scenes?.length) {
        throw new HTTPError('Generated script has invalid structure', 500);
      }

      res.json({
        success: true,
        script
      });
    } catch (error) {
      console.error('PDF Script Generation Error:', error);
      next(new HTTPError('Failed to generate script from PDF', 500));
    }
  }

  static async generatePdfCaptions(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Starting PDF caption generation');
      const validation = pdfCaptionsSchema.safeParse(req.body);
      if (!validation.success) {
        logger.warn('Invalid request parameters');
        throw new HTTPError('Invalid request parameters', 400);
      }
      const { language, count, tone, niche } = validation.data;

      logger.info('Fetching PDF buffer');
      const buffer = await PdfController.fetchPdfBuffer(validation.data.pdfUrl);
      
      logger.info('Extracting text from PDF');
      const fullText = await PdfController.pdfService.extractFullText(buffer);
      
      if (fullText.length < 100) {
        logger.warn('PDF content too short');
        throw new HTTPError('PDF content is too short for caption generation', 400);
      }

      logger.info('Generating captions with AI');
      const captions = await PdfController.aiService.generateContent(
        'captions',
        fullText,
        language,
        count,
        tone,
        niche

      ) as string[];

      logger.info(`Generated ${captions.length} captions`);
      res.json({
        success: true,
        captions: captions.map((content: string, id: number) => ({ id, content, type: 'text' }))
      });
    } catch (error) {
      logger.error('PDF caption generation error:', error);
      next(new HTTPError('Failed to generate captions from PDF', 500));
    }
  }

  static async generatePdfScript(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('Starting PDF script generation');
      const validation = pdfScriptSchema.safeParse(req.body);
      if (!validation.success) {
        logger.warn('Invalid request parameters');
        throw new HTTPError('Invalid request parameters', 400);
      }

      const { language, tone, niche } = validation.data;
      logger.info('Fetching PDF buffer');
      const buffer = await PdfController.fetchPdfBuffer(validation.data.pdfUrl);
      
      logger.info('Extracting text from PDF');
      const fullText = await PdfController.pdfService.extractFullText(buffer);
      
      if (fullText.length < 250) {
        logger.warn('PDF content too short');
        throw new HTTPError('PDF content is too short for meaningful script generation', 400);
      }

      logger.info('Generating script with AI');
      const script = await PdfController.aiService.generateContent(
        'script',
        fullText,
        language,
        1,
        tone,
        niche

      ) as ScriptStructure;


      if (!script?.scenes?.length) {
        logger.error('Generated script has invalid structure');
        throw new HTTPError('Generated script has invalid structure', 500);
      }

      logger.info(`Generated script with ${script.scenes.length} scenes`);
      res.json({
        success: true,
        script
      });
    } catch (error) {
      logger.error('PDF script generation error:', error);
      next(new HTTPError('Failed to generate script from PDF', 500));
    }
  }

  private static async fetchPdfBuffer(pdfUrl: string): Promise<Buffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(pdfUrl, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'ContentForge/1.0' }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`PDF fetch failed - Status: ${response.status} URL: ${pdfUrl}`);
      throw new HTTPError(`Failed to fetch PDF (Status ${response.status})`, 400);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/pdf')) {
      throw new HTTPError('URL does not point to a PDF file', 400);
    }

    return Buffer.from(await response.arrayBuffer());
  }
} 