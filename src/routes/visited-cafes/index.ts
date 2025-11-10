import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import {
  getVisitedCafesHandler,
  markCafeVisitedHandler,
  unmarkCafeVisitedHandler,
  isCafeVisitedHandler,
} from './handlers';

export async function visitedCafesRoutes(app: FastifyInstance) {
  // Get user's visited cafes
  app.get('/', {
    preHandler: authenticate,
    handler: getVisitedCafesHandler,
  });

  // Mark a cafe as visited
  app.post('/:placeId', {
    preHandler: authenticate,
    handler: markCafeVisitedHandler,
  });

  // Unmark a cafe as visited
  app.delete('/:placeId', {
    preHandler: authenticate,
    handler: unmarkCafeVisitedHandler,
  });

  // Check if cafe is visited
  app.get('/:placeId/status', {
    preHandler: authenticate,
    handler: isCafeVisitedHandler,
  });
}
