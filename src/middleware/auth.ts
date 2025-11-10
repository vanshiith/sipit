import { FastifyRequest, FastifyReply } from 'fastify';
import { firebaseAuth } from '../lib/firebase-auth';
import { prisma } from '../lib/prisma';

export interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    email: string;
  };
}

export async function authenticate(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: {
          message: 'Missing or invalid authorization header',
          statusCode: 401,
        },
      });
    }

    const token = authHeader.substring(7);

    // Verify token with Firebase
    const decodedToken = await firebaseAuth.verifyIdToken(token);

    if (!decodedToken.email) {
      return reply.status(401).send({
        error: {
          message: 'Invalid token: email not found',
          statusCode: 401,
        },
      });
    }

    // Check if user exists in our database
    const dbUser = await prisma.user.findUnique({
      where: { email: decodedToken.email },
    });

    if (!dbUser) {
      return reply.status(404).send({
        error: {
          message: 'User not found in database',
          statusCode: 404,
        },
      });
    }

    // Attach user info to request
    request.user = {
      id: dbUser.id,
      email: dbUser.email,
    };
  } catch (error: any) {
    request.log.error('Authentication error:', error);
    return reply.status(401).send({
      error: {
        message: error.message || 'Invalid or expired token',
        statusCode: 401,
      },
    });
  }
}

export async function optionalAuthenticate(
  request: AuthenticatedRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return; // Continue without authentication
    }

    const token = authHeader.substring(7);

    // Verify token with Firebase
    const decodedToken = await firebaseAuth.verifyIdToken(token);

    if (!decodedToken.email) {
      return; // Continue without authentication
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: decodedToken.email },
    });

    if (dbUser) {
      request.user = {
        id: dbUser.id,
        email: dbUser.email,
      };
    }
  } catch (error) {
    request.log.error('Optional authentication error:', error);
    // Continue without authentication on error
  }
}
