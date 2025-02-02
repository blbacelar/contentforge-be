import { HTTPError } from '../utils/errors';
import fetch from 'node-fetch';
import cloudinary from 'cloudinary';
import Parser from 'pdf2json';
import { logger } from '../utils/logger';

export class PdfService {
  async processPdf(buffer: Buffer): Promise<string[]> {
    logger.info('🔄 Starting PDF processing...');
    logger.time('pdf-processing');
    
    try {
      const fullText = await this.extractFullText(buffer);
      logger.debug(`📄 Extracted text length: ${fullText.length} characters`);
      
      const captions = this.extractCaptions(fullText);
      logger.info(`✨ Generated ${captions.length} captions`);
      
      logger.timeEnd('pdf-processing');
      return captions;
    } catch (error: unknown) {
      logger.error('❌ PDF processing error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new HTTPError('Unknown PDF processing error', 500);
    }
  }

  private extractCaptions(text: string): string[] {
    logger.time('caption-extraction');
    const captions = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length >= 10)
      .slice(0, 15);
    
    logger.timeEnd('caption-extraction');
    logger.info(`📝 Extracted ${captions.length} captions`);
    return captions;
  }

  async processCloudinaryPdf(publicId: string): Promise<string[]> {
    logger.info(`🌥️ Processing Cloudinary PDF: ${publicId}`);
    logger.time('cloudinary-processing');
    
    try {
      const buffer = await this.getPdfBuffer(publicId);
      logger.info(`📦 Got PDF buffer: ${buffer.length} bytes`);
      
      const result = await this.processPdf(buffer);
      logger.timeEnd('cloudinary-processing');
      return result;
    } catch (error: unknown) {
      logger.error('❌ Cloudinary PDF processing failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new HTTPError('Failed to process Cloudinary PDF', 500);
    }
  }

  private async getPdfBuffer(publicId: string): Promise<Buffer> {
    logger.time('pdf-download');
    try {
      const url = cloudinary.v2.url(publicId, { resource_type: 'raw' });
      logger.info(`🔗 Fetching PDF from: ${url}`);
      
      const response = await fetch(url);
      const buffer = Buffer.from(await response.arrayBuffer());
      
      logger.timeEnd('pdf-download');
      logger.info(`📥 Downloaded PDF: ${buffer.length} bytes`);
      return buffer;
    } catch (error: unknown) {
      logger.error('❌ PDF download failed:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new HTTPError('Unknown PDF download error', 500);
    }
  }

  async extractFullText(buffer: Buffer): Promise<string> {
    logger.info('📄 Starting PDF text extraction');
    return new Promise((resolve, reject) => {
      const pdfParser = new Parser();
      let textContent = '';

      pdfParser.on('pdfParser_dataReady', (data: any) => {
        logger.info(`📊 PDF parsing complete, processing ${data.Pages.length} pages`);
        try {
          textContent = data.Pages
            .flatMap((page: any) => {
              logger.debug(`📑 Processing page with ${page.Texts.length} text elements`);
              return page.Texts;
            })
            .map((text: any) => decodeURIComponent(text.R[0].T))
            .join(' ');
          
          logger.info(`📝 Extracted ${textContent.length} characters`);
          resolve(textContent);
        } catch (error) {
          logger.error('❌ Text extraction error:', error);
          reject(error);
        }
      });

      pdfParser.on('pdfParser_dataError', (error: any) => {
        logger.error('❌ PDF parser error:', error);
        reject(error);
      });

      logger.info('🔄 Starting PDF parsing');
      pdfParser.parseBuffer(buffer);
    });
  }
}