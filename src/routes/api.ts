import { Router } from 'express';
import multer from 'multer';
import { 
  PdfController,
  YoutubeController,
  TextController,
  AIController,
  UploadController
} from '../controllers';

// import validationMiddleware from '../middleware/validation.js';

export function createApiRouter() {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage() });

  // YouTube routes
  router.post('/youtube/transcript', YoutubeController.getYouTubeTranscript);
  router.post('/youtube/captions', YoutubeController.generateYouTubeCaptions);
  router.post('/youtube/script', YoutubeController.generateYouTubeScript);

  // PDF routes
  router.post('/pdf/process', PdfController.processPdf);
  router.post('/pdf/captions', PdfController.generatePdfCaptions);
  router.post('/pdf/script', PdfController.generatePdfScript);

  // Text routes
  router.post('/text/captions', TextController.generateTextCaptions);
  router.post('/text/script', TextController.generateTextScript);

  // Upload routes
  router.post('/upload', upload.single('file'), UploadController.handleUpload);

  // AI routes
  router.post('/ai', AIController.generateContent);

  return router;
} 