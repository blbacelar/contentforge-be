import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', async (req, res, next) => {
  logger.info('📥 GET /health - Request received');
  await HealthController.checkHealth(req, res, next);
});

router.get('/ai-test', async (req, res, next) => {
  logger.info('📥 GET /health/ai-test - Request received');
  await HealthController.testAIEndpoint(req, res, next);
});


export const healthRoutes = router;