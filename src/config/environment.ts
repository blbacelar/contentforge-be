import 'dotenv/config';
import { z } from 'zod';

export const envSchema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  CLOUDINARY_UPLOAD_PRESET: z.string(),
  DEEPSEEK_API_KEY: z.string(),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().optional().default(3000),
  CORS_ORIGIN: z.string().url().optional().default('http://localhost:3000')
});

export const env = envSchema.parse({
  ...process.env,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '3000'
}); 