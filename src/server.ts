import 'dotenv/config';
import { createServer } from 'http';
import { env } from './config/environment';
import { initializeApp } from './app';
import { logger } from './utils/logger';

logger.info('🚀 Server starting...');

const PORT = env.PORT;

// Initialize app without starting server
const app = initializeApp();
const server = createServer(app);

// Start server separately
server.listen(PORT, () => {
  logger.info(`
    🚀 Server running in ${env.NODE_ENV} mode
    🔌 Connected to port ${PORT}
    📅 ${new Date().toLocaleString()}
  `);
}); 