import { z } from 'zod';
import { TONES } from './tones';

export const textCaptionsSchema = z.object({
  text: z.string().min(100).max(5000),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']),
  count: z.number().int().min(1).max(5).optional().default(1),
  tone: z.enum(TONES).optional().default('Casual'),
  niche: z.string().min(3).max(50).optional().default('general')
});

export const textScriptSchema = z.object({
  text: z.string().min(50).max(5000),
  language: z.enum(['en-US', 'es-ES', 'pt-BR']).optional().default('en-US'),
  tone: z.enum(TONES).optional().default('Casual'),
  niche: z.string().min(3).max(50).optional().default('general')
});

export const textCombinedSchema = textCaptionsSchema.merge(textScriptSchema).extend({
  text: z.string().min(100).max(5000) // Use higher minimum from captions
});
