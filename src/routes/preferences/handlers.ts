import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma';
import { cacheHelpers } from '../../lib/redis';
import { AuthenticatedRequest } from '../../middleware/auth';
import {
  UpdateMoodInput,
  UpdateRadiusInput,
  UpdateNotificationsInput,
} from './schemas';

export async function updateMoodHandler(
  request: AuthenticatedRequest & FastifyRequest<{ Body: UpdateMoodInput }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.id;
    const { moodMetric } = request.body;

    const preferences = await prisma.userPreferences.update({
      where: { userId },
      data: {
        currentMoodMetric: moodMetric,
        lastMoodUpdate: new Date(),
      },
    });

    // Invalidate cached preferences
    await cacheHelpers.del(`user:preferences:${userId}`);

    return reply.send({
      data: {
        preferences,
      },
    });
  } catch (error) {
    request.log.error('Update mood error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to update mood preference',
        statusCode: 500,
      },
    });
  }
}

export async function updateRadiusHandler(
  request: AuthenticatedRequest & FastifyRequest<{ Body: UpdateRadiusInput }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.id;
    const { radiusKm } = request.body;

    const preferences = await prisma.userPreferences.update({
      where: { userId },
      data: {
        preferredRadiusKm: radiusKm,
      },
    });

    // Invalidate cached preferences
    await cacheHelpers.del(`user:preferences:${userId}`);

    return reply.send({
      data: {
        preferences,
      },
    });
  } catch (error) {
    request.log.error('Update radius error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to update radius preference',
        statusCode: 500,
      },
    });
  }
}

export async function updateNotificationsHandler(
  request: AuthenticatedRequest &
    FastifyRequest<{ Body: UpdateNotificationsInput }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.id;
    const updates = request.body;

    const preferences = await prisma.userPreferences.update({
      where: { userId },
      data: updates,
    });

    // Invalidate cached preferences
    await cacheHelpers.del(`user:preferences:${userId}`);

    return reply.send({
      data: {
        preferences,
      },
    });
  } catch (error) {
    request.log.error('Update notifications error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to update notification preferences',
        statusCode: 500,
      },
    });
  }
}

export async function shouldShowMoodPromptHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.id;

    const preferences = await prisma.userPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      return reply.status(404).send({
        error: {
          message: 'Preferences not found',
          statusCode: 404,
        },
      });
    }

    // Check if 6 hours have passed since last mood update
    const sixHoursInMs = 6 * 60 * 60 * 1000;
    const now = new Date().getTime();
    const lastUpdate = preferences.lastMoodUpdate?.getTime() || 0;
    const shouldShow = now - lastUpdate >= sixHoursInMs;

    return reply.send({
      data: {
        shouldShowPrompt: shouldShow,
        lastMoodUpdate: preferences.lastMoodUpdate,
        currentMoodMetric: preferences.currentMoodMetric,
      },
    });
  } catch (error) {
    request.log.error('Should show mood prompt error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to check mood prompt status',
        statusCode: 500,
      },
    });
  }
}
