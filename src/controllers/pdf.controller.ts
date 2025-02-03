import { Request, Response, NextFunction } from 'express';
import { PdfService } from '../services/pdf.service';
import { HTTPError } from '../utils/errors';
import { z } from 'zod';
import { AIService } from '../services/ai.service';
import { ScriptStructure } from '../types/script';
import { logger } from '../utils/logger';
import { TONES } from '../config/tones';
import { CaptionGenerationService } from '../services/caption-generation.service';
import { ScriptGenerationService } from '../services/script-generation.service';

export const pdfSchema = z.object({
  url: z.string().url(),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']).optional().default('en-US'),
  tone: z.enum(['casual', 'formal', 'humorous', 'inspirational', 'professional']).optional().default('casual'),
  niche: z.string().min(3).max(50).optional().default('general')
});


export const cloudinaryPdfSchema = z.object({
  publicId: z.string()
});

export const pdfCaptionsSchema = z.object({
  url: z.string().url(),
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
  url: z.string().url(),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']),
  tone: z.enum(TONES).optional().default('Casual'),
  niche: z.string().min(3).max(50).optional().default('general')
});



export const pdfCombinedSchema = z.object({
  url: z.string().url(),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']),
  count: z.number().int().min(1).max(5).optional().default(1),
  tone: z.enum(['casual', 'formal', 'humorous', 'inspirational', 'professional']).optional().default('casual'),

  niche: z.string().min(3).max(50).optional().default('general')
});

export class PdfController {
  private static captionService = new CaptionGenerationService();
  private static scriptService = new ScriptGenerationService();
  private static pdfService: PdfService;


  static async processPdf(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info('🔄 Starting PDF processing...');
      const validation = pdfCaptionsSchema.safeParse(req.body);
      if (!validation.success) {
        logger.warn('❌ Invalid request parameters');
        throw new HTTPError('Invalid PDF URL', 400);
      }
      const buffer = await PdfController.fetchPdfBuffer(validation.data.url);
      const fullText = await PdfController.pdfService.extractFullText(buffer);
      

      res.json({
        success: true,
        text: fullText
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

      const { url, language, count, tone, niche } = validation.data;

      const buffer = await PdfController.fetchPdfBuffer(url);
      const fullText = await PdfController.pdfService.extractFullText(buffer);
      


      if (fullText.length < 100) {
        throw new HTTPError('PDF content is too short for caption generation', 400);
      }

      const captions = await PdfController.captionService.generateCaptions(
        fullText,
        language,
        count,
        tone,
        niche
      );



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

      const buffer = await PdfController.fetchPdfBuffer(validation.data.url);
      const fullText = await PdfController.pdfService.extractFullText(buffer);
      const { language, tone, niche } = validation.data;
      

      if (fullText.length < 250) {
        throw new HTTPError('PDF content is too short for meaningful script generation', 400);
      }

      const script = await PdfController.scriptService.generateScript(
        fullText,
        language,
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
      const { language, count, tone, niche, url } = validation.data;


      logger.info('Fetching PDF buffer');
      const buffer = await PdfController.fetchPdfBuffer(url);

      logger.info('Extracting text from PDF');
      const fullText = await PdfController.pdfService.extractFullText(buffer);
      
      if (fullText.length < 100) {
        logger.warn('PDF content too short');
        throw new HTTPError('PDF content is too short for caption generation', 400);
      }

      logger.info('Generating captions with AI');
      const captions = await PdfController.captionService.generateCaptions(
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
        throw new HTTPError('Invalid PDF URL or language', 400);
      }
      const { language, tone, niche, url } = validation.data;

      logger.info('Fetching PDF buffer');
      const buffer = await PdfController.fetchPdfBuffer(url);
      
      logger.info('Extracting text from PDF');
      const fullText = await PdfController.pdfService.extractFullText(buffer);
      
      if (fullText.length < 100) {
        logger.warn('PDF content too short');
        throw new HTTPError('PDF content is too short for script generation', 400);
      }

      logger.info('Generating script with AI');
      const script = await PdfController.scriptService.generateScript(
        fullText,
        language,
        tone,
        niche
      ) as ScriptStructure;

      res.json({
        success: true,
        script
      });
    } catch (error) {
      logger.error('PDF script generation error:', error);
      next(new HTTPError('Failed to generate script from PDF', 500));
    }
  }

  static async generateCombinedPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const validation = pdfCombinedSchema.safeParse(req.body);
      if (!validation.success) {
        throw new HTTPError('Invalid request parameters', 400);
      }

      const { language, count, tone, niche, url } = validation.data;
      const buffer = await PdfController.fetchPdfBuffer(url);
      const fullText = await PdfController.pdfService.extractFullText(buffer);


      const [captions, script] = await Promise.all([
        PdfController.captionService.generateCaptions(
          fullText,
          language,
          count,
          tone,
          niche
        ),
        PdfController.scriptService.generateScript(
          fullText,
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
      logger.error('PDF combined generation error:', error);
      next(new HTTPError('Failed to generate combined PDF content', 500));
    }
  }

  private static async fetchPdfBuffer(url: string): Promise<Buffer> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'ContentForge/1.0' }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`PDF fetch failed - Status: ${response.status} URL: ${url}`);
      throw new HTTPError(`Failed to fetch PDF (Status ${response.status})`, 400);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/pdf')) {
      throw new HTTPError('URL does not point to a PDF file', 400);
    }

    return Buffer.from(await response.arrayBuffer());
  }
}

export const processPdf = PdfController.processPdf;
export const generatePdfCaptions = PdfController.generatePdfCaptions;
export const generatePdfScript = PdfController.generatePdfScript;
export const generateCombinedPdf = PdfController.generateCombinedPdf; 