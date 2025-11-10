import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import {
  createReviewHandler,
  updateReviewHandler,
  deleteReviewHandler,
  getCafeReviewsHandler,
} from './handlers';
import { createReviewSchema, updateReviewSchema } from './schemas';

export async function reviewRoutes(app: FastifyInstance) {
  // Create review
  app.post('/', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: [
          'cafeId',
          'foodRating',
          'drinksRating',
          'ambienceRating',
          'serviceRating',
        ],
        properties: {
          cafeId: { type: 'string', format: 'uuid' },
          foodRating: { type: 'number', minimum: 1, maximum: 5 },
          drinksRating: { type: 'number', minimum: 1, maximum: 5 },
          ambienceRating: { type: 'number', minimum: 1, maximum: 5 },
          serviceRating: { type: 'number', minimum: 1, maximum: 5 },
          comment: { type: 'string' },
          photos: { type: 'array', items: { type: 'string', format: 'uri' } },
        },
      },
    },
    handler: async (request, reply) => {
      const result = createReviewSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            details: result.error.errors,
            statusCode: 400,
          },
        });
      }
      return createReviewHandler(request as any, reply);
    },
  });

  // Update review
  app.put('/:id', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          foodRating: { type: 'number', minimum: 1, maximum: 5 },
          drinksRating: { type: 'number', minimum: 1, maximum: 5 },
          ambienceRating: { type: 'number', minimum: 1, maximum: 5 },
          serviceRating: { type: 'number', minimum: 1, maximum: 5 },
          comment: { type: 'string' },
          photos: { type: 'array', items: { type: 'string', format: 'uri' } },
        },
      },
    },
    handler: async (request, reply) => {
      const result = updateReviewSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            details: result.error.errors,
            statusCode: 400,
          },
        });
      }
      return updateReviewHandler(request as any, reply);
    },
  });

  // Delete review
  app.delete('/:id', {
    preHandler: authenticate,
    handler: deleteReviewHandler,
  });

  // Get reviews for a cafe
  app.get('/cafe/:cafeId', {
    handler: getCafeReviewsHandler,
  });
}
