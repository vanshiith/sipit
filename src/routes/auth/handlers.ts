import { FastifyRequest, FastifyReply } from 'fastify';
import { firebaseAuth } from '../../lib/firebase-auth';
import { prisma } from '../../lib/prisma';
import { RegisterInput, LoginInput, OAuthInput } from './schemas';

export async function registerHandler(
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply
) {
  const { email, password, name } = request.body;

  try {
    // Create user in Firebase Auth
    const firebaseUser = await firebaseAuth.createUser(email, password, name);

    // Create user in our database
    const user = await prisma.user.create({
      data: {
        email,
        name,
        preferences: {
          create: {
            preferredRadiusKm: 5.0,
          },
        },
      },
      include: {
        preferences: true,
      },
    });

    // Create custom token for immediate login
    const customToken = await firebaseAuth.createCustomToken(firebaseUser.uid);

    // Try to get ID token via REST API, fall back to custom token if email/password auth not enabled
    let sessionData;
    try {
      const authResponse = await firebaseAuth.verifyPassword(email, password);
      sessionData = {
        access_token: authResponse.idToken,
        refresh_token: authResponse.refreshToken,
        expires_in: parseInt(authResponse.expiresIn),
        token_type: 'bearer',
      };
    } catch (error: any) {
      // If email/password auth not enabled, use custom token
      request.log.warn('Firebase REST API error, using custom token:', error.message);
      sessionData = {
        access_token: customToken,
        token_type: 'bearer',
        message: 'Using custom token. Please enable Email/Password authentication in Firebase Console.',
      };
    }

    return reply.status(201).send({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          personalityType: user.personalityType,
          profilePictureUrl: user.profilePictureUrl,
          createdAt: user.createdAt,
        },
        session: sessionData,
      },
    });
  } catch (error: any) {
    request.log.error('Registration error:', error);
    return reply.status(400).send({
      error: {
        message: error.message || 'Failed to register user',
        statusCode: 400,
      },
    });
  }
}

export async function loginHandler(
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
) {
  const { email, password } = request.body;

  try {
    // Verify password with Firebase REST API
    const authResponse = await firebaseAuth.verifyPassword(email, password);

    // Get user from our database
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      return reply.status(404).send({
        error: {
          message: 'User not found',
          statusCode: 404,
        },
      });
    }

    return reply.send({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          personalityType: user.personalityType,
          profilePictureUrl: user.profilePictureUrl,
          preferences: user.preferences,
        },
        session: {
          access_token: authResponse.idToken,
          refresh_token: authResponse.refreshToken,
          expires_in: parseInt(authResponse.expiresIn),
          token_type: 'bearer',
        },
      },
    });
  } catch (error: any) {
    request.log.error('Login error:', error);
    return reply.status(401).send({
      error: {
        message: error.message || 'Invalid credentials',
        statusCode: 401,
      },
    });
  }
}

export async function oauthHandler(
  request: FastifyRequest<{ Body: OAuthInput }>,
  reply: FastifyReply
) {
  const { provider, idToken } = request.body;

  try {
    // Verify OAuth token with Firebase
    const decodedToken = await firebaseAuth.verifyIdToken(idToken);

    const email = decodedToken.email!;
    const name = decodedToken.name || email.split('@')[0];
    const photoURL = decodedToken.picture;

    // Check if user exists in our database
    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        preferences: true,
      },
    });

    // Create user if doesn't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          profilePictureUrl: photoURL,
          preferences: {
            create: {
              preferredRadiusKm: 5.0,
            },
          },
        },
        include: {
          preferences: true,
        },
      });
    }

    return reply.send({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          personalityType: user.personalityType,
          profilePictureUrl: user.profilePictureUrl,
          preferences: user.preferences,
        },
        session: {
          access_token: idToken,
          token_type: 'bearer',
        },
      },
    });
  } catch (error: any) {
    request.log.error('OAuth error:', error);
    return reply.status(401).send({
      error: {
        message: error.message || 'Failed to authenticate with OAuth',
        statusCode: 401,
      },
    });
  }
}

export async function logoutHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Verify token and revoke refresh tokens
      const decodedToken = await firebaseAuth.verifyIdToken(token);
      await firebaseAuth.revokeRefreshTokens(decodedToken.uid);
    }

    return reply.send({
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error: any) {
    request.log.error('Logout error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to logout',
        statusCode: 500,
      },
    });
  }
}

export async function changePasswordHandler(
  request: FastifyRequest<{ Body: { currentPassword: string; newPassword: string } }>,
  reply: FastifyReply
) {
  try {
    const { currentPassword, newPassword } = request.body;
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: {
          message: 'No authorization token provided',
          statusCode: 401,
        },
      });
    }

    // Get the current user from the token
    const token = authHeader.substring(7);
    const decodedToken = await firebaseAuth.verifyIdToken(token);

    // Get user email from Firebase
    const firebaseUser = await firebaseAuth.getUserByUid(decodedToken.uid);

    // Verify current password
    try {
      await firebaseAuth.verifyPassword(firebaseUser.email!, currentPassword);
    } catch (error) {
      return reply.status(400).send({
        error: {
          message: 'Current password is incorrect',
          statusCode: 400,
        },
      });
    }

    // Update password
    await firebaseAuth.updateUserPassword(decodedToken.uid, newPassword);

    // Revoke all existing sessions for security
    await firebaseAuth.revokeRefreshTokens(decodedToken.uid);

    return reply.send({
      data: {
        message: 'Password changed successfully',
      },
    });
  } catch (error: any) {
    request.log.error('Change password error:', error);
    return reply.status(500).send({
      error: {
        message: error.message || 'Failed to change password',
        statusCode: 500,
      },
    });
  }
}
