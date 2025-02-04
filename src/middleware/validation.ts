import { RequestHandler } from 'express';
import { z } from 'zod';
import { HTTPError } from '../utils/errors';
import { pdfSchema } from '../controllers/pdf.controller';
import { transcriptSchema, youtubeCaptionsSchema, youtubeScriptSchema } from '../controllers/youtube.controller';
import { aiSchema } from '../controllers/ai.controller';
import { cloudinaryPdfSchema } from '../controllers/pdf.controller';
import { pdfCaptionsSchema } from '../controllers/pdf.controller';
import { cloudinaryCaptionsSchema } from '../controllers/pdf.controller';
import { pdfScriptSchema } from '../controllers/pdf.controller';
import { textCaptionsSchema } from '../controllers/text.controller';

export const schemas = {
  youtube: transcriptSchema,
  youtubeCaptions: youtubeCaptionsSchema,
  pdf: pdfSchema,
  ai: aiSchema,
  youtubeScript: youtubeScriptSchema,
  cloudinaryPdf: cloudinaryPdfSchema,
  pdfCaptions: pdfCaptionsSchema,
  cloudinaryCaptions: cloudinaryCaptionsSchema,
  pdfScript: pdfScriptSchema,
  textCaptions: textCaptionsSchema
};

export const validateRequest = (schemaType: keyof typeof schemas): RequestHandler => {
  return (req, _res, next) => {
    const validation = schemas[schemaType].safeParse(req.body);
    if (!validation.success) {
      next(new HTTPError(`Invalid ${schemaType} request`, 400));
      return;
    }
    req.body = validation.data;
    next();
  };
}; 