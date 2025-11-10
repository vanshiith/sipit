import { FastifyInstance } from 'fastify';
import { searchCafesHandler, searchUsersHandler } from './handlers';
import { searchCafesSchema, searchUsersSchema } from './schema';

export async function searchRoutes(app: FastifyInstance) {
  // Search cafes globally
  app.get('/cafes', {
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

  // Search users
  app.get('/users', {
    preHandler: app.authenticate,
    handler: async (request, reply) => {
      const result = searchUsersSchema.safeParse(request.query);
      if (!result.success) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            details: result.error.errors,
            statusCode: 400,
          },
        });
      }
      return searchUsersHandler(request as any, reply);
    },
  });
}
