import { v2 as cloudinary } from 'cloudinary';
import { HTTPError } from '../utils/errors';

export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }

  async uploadPdf(buffer: Buffer): Promise<{ secure_url: string; public_id: string }> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          format: 'pdf'
        },
        (error, result) => {
          if (error || !result) {
            reject(new HTTPError('Cloudinary upload failed', 500));
          } else {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id
            });
          }
        }
      );
      uploadStream.end(buffer);
    });
  }

  async getSignedUrl(publicId: string): Promise<string> {
    const signedUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      sign_url: true,
      expiration: Date.now() + 15*60*1000 // 15 minutes
    });
    return signedUrl;
  }
} 