import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { config } from './config';
import { logger } from './utils/logger';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { preferencesRoutes } from './routes/preferences';
import { cafeRoutes } from './routes/cafes';
import { reviewRoutes } from './routes/reviews';
import { feedRoutes } from './routes/feed';
import { uploadRoutes } from './routes/upload';
import { notificationRoutes } from './routes/notifications';
import { searchRoutes } from './routes/search';
import { menuRoutes } from './routes/menu';
import { savedCafesRoutes } from './routes/saved-cafes';
import { visitedCafesRoutes } from './routes/visited-cafes';

export async function buildApp() {
  const app = Fastify({
    logger: logger,
    disableRequestLogging: false,
    requestIdLogLabel: 'reqId',
    requestIdHeader: 'x-request-id',
  });

  // Security plugins
  await app.register(helmet, {
    contentSecurityPolicy: config.server.nodeEnv === 'production',
  });

  await app.register(cors, {
    origin: config.server.nodeEnv === 'production' ? ['https://yourdomain.com'] : true,
    credentials: true,
  });

  // Rate limiting
  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
  });

  // Multipart for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5,
    },
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Root endpoint
  app.get('/', async () => {
    return {
      name: 'Sip-It API',
      version: '1.0.0',
      status: 'running',
    };
  });

  // Register route handlers
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(userRoutes, { prefix: '/api/v1/users' });
  await app.register(preferencesRoutes, { prefix: '/api/v1/preferences' });
  await app.register(cafeRoutes, { prefix: '/api/v1/cafes' });
  await app.register(reviewRoutes, { prefix: '/api/v1/reviews' });
  await app.register(feedRoutes, { prefix: '/api/v1/feed' });
  await app.register(uploadRoutes, { prefix: '/api/v1/upload' });
  await app.register(notificationRoutes, { prefix: '/api/v1/notifications' });
  await app.register(searchRoutes, { prefix: '/api/v1/search' });
  await app.register(menuRoutes, { prefix: '/api/v1/menu' });
  await app.register(savedCafesRoutes, { prefix: '/api/v1/saved-cafes' });
  await app.register(visitedCafesRoutes, { prefix: '/api/v1/visited-cafes' });

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    app.log.error(error);

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    reply.status(statusCode).send({
      error: {
        message,
        statusCode,
        timestamp: new Date().toISOString(),
      },
    });
  });

  return app;
}
