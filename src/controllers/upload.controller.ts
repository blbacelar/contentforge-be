import { Request, Response, NextFunction } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import { HTTPError } from '../utils/errors';
import multer from 'multer';

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export class UploadController {
  static async handleUpload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new HTTPError('No file provided', 400);
      }

      const fileStr = req.file.buffer.toString('base64');
      const uploadResponse = await cloudinary.uploader.upload(
        `data:application/pdf;base64,${fileStr}`,
        {
          resource_type: 'raw',
          public_id: `${Date.now()}-${req.file.originalname}`,
          overwrite: true,
          type: 'upload',
          access_mode: 'public',
          format: 'pdf'
        }
      );

      res.json({
        success: true,
        secure_url: uploadResponse.secure_url,
        public_id: uploadResponse.public_id
      });
    } catch (error) {
      console.error('Upload error:', error);
      next(new HTTPError(
        error instanceof Error ? error.message : 'Upload failed',
        500
      ));
    }
  }
} 