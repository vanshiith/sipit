import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import {
  getSavedCafesHandler,
  saveCafeHandler,
  unsaveCafeHandler,
  isCafeSavedHandler,
} from './handlers';

export async function savedCafesRoutes(app: FastifyInstance) {
  // Get user's saved cafes
  app.get('/', {
    preHandler: authenticate,
    handler: getSavedCafesHandler,
  });

  // Save a cafe
  app.post('/:placeId', {
    preHandler: authenticate,
    handler: saveCafeHandler,
  });

  // Unsave a cafe
  app.delete('/:placeId', {
    preHandler: authenticate,
    handler: unsaveCafeHandler,
  });

  // Check if cafe is saved
  app.get('/:placeId/status', {
    preHandler: authenticate,
    handler: isCafeSavedHandler,
  });
}
