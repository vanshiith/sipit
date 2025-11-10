import { FastifyInstance } from 'fastify';
import { optionalAuthenticate, authenticate } from '../../middleware/auth';
import {
  getNearbyCafesHandler,
  getCafeByIdHandler,
  searchCafesHandler,
  syncCafeHandler,
  getCafeDetailsHandler,
  followCafeHandler,
  unfollowCafeHandler,
  getCafePhotosHandler,
} from './handlers';
import { nearbyCafesSchema, searchCafesSchema } from './schemas';

export async function cafeRoutes(app: FastifyInstance) {
  // Get nearby cafes
  app.get('/nearby', {
    preHandler: optionalAuthenticate,
    schema: {
      querystring: {
        type: 'object',
        required: ['latitude', 'longitude'],
        properties: {
          latitude: { type: 'number', minimum: -90, maximum: 90 },
          longitude: { type: 'number', minimum: -180, maximum: 180 },
          radiusKm: { type: 'number', minimum: 0.5, maximum: 50 },
          sortBy: {
            type: 'string',
            enum: ['FOOD', 'DRINKS', 'AMBIENCE', 'SERVICE'],
          },
          page: { type: 'number', minimum: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100 },
        },
      },
    },
    handler: async (request, reply) => {
      const result = nearbyCafesSchema.safeParse(request.query);
      if (!result.success) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            details: result.error.errors,
            statusCode: 400,
          },
        });
      }
      return getNearbyCafesHandler(request as any, reply);
    },
  });

  // Get cafe by ID
  app.get('/:id', {
    preHandler: optionalAuthenticate,
    handler: getCafeByIdHandler,
  });

  // Search cafes by text
  app.get('/search', {
    preHandler: optionalAuthenticate,
    schema: {
      querystring: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', minLength: 1 },
          latitude: { type: 'number', minimum: -90, maximum: 90 },
          longitude: { type: 'number', minimum: -180, maximum: 180 },
        },
      },
    },
    handler: async (request, reply) => {
      const result = searchCafesSchema.safeParse(request.query);
      if (!result.success) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            details: result.error.errors,
            statusCode: 400,
          },
        });
      }
      return searchCafesHandler(request as any, reply);
    },
  });

  // Sync cafe from Google Places
  app.post('/sync/:googlePlaceId', {
    handler: syncCafeHandler,
  });

  // Get cafe details by place ID
  app.get('/details/:placeId', {
    preHandler: optionalAuthenticate,
    handler: getCafeDetailsHandler,
  });

  // Follow a cafe
  app.post('/:placeId/follow', {
    preHandler: authenticate,
    handler: followCafeHandler,
  });

  // Unfollow a cafe
  app.delete('/:placeId/follow', {
    preHandler: authenticate,
    handler: unfollowCafeHandler,
  });

  // Get user-submitted photos for a cafe
  app.get('/:placeId/photos', {
    handler: getCafePhotosHandler,
  });
}
