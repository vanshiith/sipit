import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';

export async function getNotificationsHandler(
  request: AuthenticatedRequest &
    FastifyRequest<{ Querystring: { page?: string; limit?: string; unreadOnly?: string } }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.id;
    const page = parseInt(request.query.page || '1', 10);
    const limit = parseInt(request.query.limit || '20', 10);
    const unreadOnly = request.query.unreadOnly === 'true';
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return reply.send({
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    request.log.error('Get notifications error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to fetch notifications',
        statusCode: 500,
      },
    });
  }
}

export async function markNotificationAsReadHandler(
  request: AuthenticatedRequest & FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.id;
    const { id } = request.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return reply.status(404).send({
        error: {
          message: 'Notification not found',
          statusCode: 404,
        },
      });
    }

    if (notification.userId !== userId) {
      return reply.status(403).send({
        error: {
          message: 'You can only mark your own notifications as read',
          statusCode: 403,
        },
      });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return reply.send({
      data: {
        notification: updated,
      },
    });
  } catch (error) {
    request.log.error('Mark notification as read error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to mark notification as read',
        statusCode: 500,
      },
    });
  }
}

export async function markAllNotificationsAsReadHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });

    return reply.send({
      data: {
        message: 'All notifications marked as read',
      },
    });
  } catch (error) {
    request.log.error('Mark all notifications as read error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to mark all notifications as read',
        statusCode: 500,
      },
    });
  }
}

export async function deleteNotificationHandler(
  request: AuthenticatedRequest & FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.id;
    const { id } = request.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return reply.status(404).send({
        error: {
          message: 'Notification not found',
          statusCode: 404,
        },
      });
    }

    if (notification.userId !== userId) {
      return reply.status(403).send({
        error: {
          message: 'You can only delete your own notifications',
          statusCode: 403,
        },
      });
    }

    await prisma.notification.delete({
      where: { id },
    });

    return reply.send({
      data: {
        message: 'Notification deleted',
      },
    });
  } catch (error) {
    request.log.error('Delete notification error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to delete notification',
        statusCode: 500,
      },
    });
  }
}

export async function getUnreadCountHandler(
  request: AuthenticatedRequest,
  reply: FastifyReply
) {
  try {
    const userId = request.user!.id;

    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    return reply.send({
      data: {
        unreadCount: count,
      },
    });
  } catch (error) {
    request.log.error('Get unread count error:', error);
    return reply.status(500).send({
      error: {
        message: 'Failed to get unread count',
        statusCode: 500,
      },
    });
  }
}
