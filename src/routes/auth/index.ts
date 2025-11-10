import { FastifyInstance } from 'fastify';
import {
  registerHandler,
  loginHandler,
  oauthHandler,
  logoutHandler,
  changePasswordHandler,
} from './handlers';
import { registerSchema, loginSchema, oauthSchema, changePasswordSchema } from './schemas';

export async function authRoutes(app: FastifyInstance) {
  // Register
  app.post('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string', minLength: 1 },
        },
      },
    },
    handler: async (request, reply) => {
      const result = registerSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            details: result.error.errors,
            statusCode: 400,
          },
        });
      }
      return registerHandler(request as any, reply);
    },
  });

  // Login
  app.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
    },
    handler: async (request, reply) => {
      const result = loginSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            details: result.error.errors,
            statusCode: 400,
          },
        });
      }
      return loginHandler(request as any, reply);
    },
  });

  // OAuth (Google/Apple)
  app.post('/oauth', {
    schema: {
      body: {
        type: 'object',
        required: ['provider', 'idToken'],
        properties: {
          provider: { type: 'string', enum: ['google', 'apple'] },
          idToken: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const result = oauthSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            details: result.error.errors,
            statusCode: 400,
          },
        });
      }
      return oauthHandler(request as any, reply);
    },
  });

  // Logout
  app.post('/logout', {
    handler: logoutHandler,
  });

  // Change password
  app.post('/change-password', {
    preHandler: app.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 8 },
          newPassword: { type: 'string', minLength: 8 },
        },
      },
    },
    handler: async (request, reply) => {
      const result = changePasswordSchema.safeParse(request.body);
      if (!result.success) {
        return reply.status(400).send({
          error: {
            message: 'Validation failed',
            details: result.error.errors,
            statusCode: 400,
          },
        });
      }
      return changePasswordHandler(request as any, reply);
    },
  });
}
