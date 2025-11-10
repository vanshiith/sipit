import { FastifyInstance } from 'fastify';
import {
  getUserMenuHandler,
  createMenuItemHandler,
  updateMenuItemHandler,
  deleteMenuItemHandler,
} from './handlers';
import { createMenuItemSchema, updateMenuItemSchema } from './schema';

export async function menuRoutes(app: FastifyInstance) {
  // Get user's personal menu
  app.get('/users/:userId', {
    preHandler: app.authenticate,
    handler: getUserMenuHandler,
  });

  // Create a menu item
  app.post('/', {
    preHandler: app.authenticate,
    handler: async (request, reply) => {
      const result = createMenuItemSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            details: result.error.errors,
            statusCode: 400,
          },
        });
      }
      return createMenuItemHandler(request as any, reply);
    },
  });

  // Update a menu item
  app.put('/:itemId', {
    preHandler: app.authenticate,
    handler: async (request, reply) => {
      const result = updateMenuItemSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            details: result.error.errors,
            statusCode: 400,
          },
        });
      }
      return updateMenuItemHandler(request as any, reply);
    },
  });

  // Delete a menu item
  app.delete('/:itemId', {
    preHandler: app.authenticate,
    handler: deleteMenuItemHandler,
  });
}
