import { Router } from 'express';
import multer from 'multer';
import { 
  PdfController,
  YoutubeController,
  TextController,
  AIController,
  UploadController
} from '../controllers';
import { HealthController } from '../controllers/health.controller';

// import validationMiddleware from '../middleware/validation.js';

export function createApiRouter() {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage() });

  // YouTube routes
  router.post('/youtube/transcript', YoutubeController.getYouTubeTranscript);
  router.post('/youtube/captions', YoutubeController.generateYouTubeCaptions);
  router.post('/youtube/script', YoutubeController.generateYouTubeScript);
  router.post('/youtube/combined', YoutubeController.generateCombinedYouTube);

  // PDF routes
  router.post('/pdf/process', PdfController.processPdf);
  router.post('/pdf/captions', PdfController.generatePdfCaptions);
  router.post('/pdf/script', PdfController.generatePdfScript);
  router.post('/pdf/combined', PdfController.generateCombinedPdf);

  // Text routes
  router.post('/text/captions', TextController.generateTextCaptions);
  router.post('/text/script', TextController.generateTextScript);
  router.post('/text/combined', TextController.generateCombinedText);

  // Upload routes
  router.post('/upload', upload.single('file'), UploadController.handleUpload);

  // AI routes
  router.post('/ai', AIController.generateContent);

  // Health route
  router.get('/health', HealthController.checkHealth);
  router.get('/health/ai-test', HealthController.testAIEndpoint);

  return router;
} 