import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import {
  updateMoodHandler,
  updateRadiusHandler,
  updateNotificationsHandler,
  shouldShowMoodPromptHandler,
} from './handlers';
import {
  updateMoodSchema,
  updateRadiusSchema,
  updateNotificationsSchema,
} from './schemas';

export async function preferencesRoutes(app: FastifyInstance) {
  // Update mood metric
  app.put('/mood', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['moodMetric'],
        properties: {
          moodMetric: {
            type: 'string',
            enum: ['FOOD', 'DRINKS', 'AMBIENCE', 'SERVICE'],
          },
        },
      },
    },
    handler: async (request, reply) => {
      const result = updateMoodSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            details: result.error.errors,
            statusCode: 400,
          },
        });
      }
      return updateMoodHandler(request as any, reply);
    },
  });

  // Update radius preference
  app.put('/radius', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['radiusKm'],
        properties: {
          radiusKm: { type: 'number', minimum: 0.5, maximum: 50 },
        },
      },
    },
    handler: async (request, reply) => {
      const result = updateRadiusSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            details: result.error.errors,
            statusCode: 400,
          },
        });
      }
      return updateRadiusHandler(request as any, reply);
    },
  });

  // Update notification preferences
  app.put('/notifications', {
    preHandler: authenticate,
    schema: {
      body: {
        type: 'object',
        properties: {
          notifyNewCafes: { type: 'boolean' },
          notifyFriendActivity: { type: 'boolean' },
          notifyWeekly: { type: 'boolean' },
        },
      },
    },
    handler: async (request, reply) => {
      const result = updateNotificationsSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            details: result.error.errors,
            statusCode: 400,
          },
        });
      }
      return updateNotificationsHandler(request as any, reply);
    },
  });

  // Check if should show mood prompt (6 hours check)
  app.get('/should-show-mood-prompt', {
    preHandler: authenticate,
    handler: shouldShowMoodPromptHandler,
  });
}
