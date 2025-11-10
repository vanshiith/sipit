import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import {
  getMeHandler,
  getUserByIdHandler,
  updateMeHandler,
  followUserHandler,
  unfollowUserHandler,
  getFollowersHandler,
  getFollowingHandler,
  getUserReviewsHandler,
  getUserPhotosHandler,
} from './handlers';
import { updateProfileSchema } from './schemas';

export async function userRoutes(app: FastifyInstance) {
  // Get current user profile
  app.get('/me', {
    preHandler: authenticate,
    handler: getMeHandler,
  });

  // Update current user profile
  app.put('/me', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          personalityType: { type: 'string' },
          profilePictureUrl: { type: 'string', format: 'uri' },
        },
      },
    },
    handler: async (request, reply) => {
      const result = updateProfileSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            details: result.error.errors,
            statusCode: 400,
          },
        });
      }
      return updateMeHandler(request as any, reply);
    },
  });

  // Get user by ID
  app.get('/:id', {
    handler: getUserByIdHandler,
  });

  // Follow user
  app.post('/follow/:id', {
    preHandler: authenticate,
    handler: followUserHandler,
  });

  // Unfollow user
  app.delete('/unfollow/:id', {
    preHandler: authenticate,
    handler: unfollowUserHandler,
  });

  // Get user followers
  app.get('/:id/followers', {
    handler: getFollowersHandler,
  });

  // Get user following
  app.get('/:id/following', {
    handler: getFollowingHandler,
  });

  // Get user reviews
  app.get('/:id/reviews', {
    handler: getUserReviewsHandler,
  });

  // Get user photos from reviews
  app.get('/:id/photos', {
    handler: getUserPhotosHandler,
  });
}
