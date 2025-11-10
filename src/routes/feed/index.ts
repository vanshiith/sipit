import { FastifyInstance } from 'fastify';
import { authenticate, optionalAuthenticate } from '../../middleware/auth';
import { getFeedHandler, getDiscoverFeedHandler } from './handlers';

export async function feedRoutes(app: FastifyInstance) {
  // Get feed from followed users
  app.get('/', {
    preHandler: authenticate,
    handler: getFeedHandler,
  });

  // Get discover feed (popular reviews nearby or globally)
  app.get('/discover', {
    preHandler: optionalAuthenticate,
    handler: getDiscoverFeedHandler,
  });
}
