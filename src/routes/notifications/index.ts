import { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/auth';
import {
  getNotificationsHandler,
  markNotificationAsReadHandler,
  markAllNotificationsAsReadHandler,
  deleteNotificationHandler,
  getUnreadCountHandler,
} from './handlers';

export async function notificationRoutes(app: FastifyInstance) {
  // Get notifications
  app.get('/', {
    preHandler: authenticate,
    handler: getNotificationsHandler,
  });

  // Get unread count
  app.get('/unread-count', {
    preHandler: authenticate,
    handler: getUnreadCountHandler,
  });

  // Mark notification as read
  app.put('/:id/read', {
    preHandler: authenticate,
    handler: markNotificationAsReadHandler,
  });

  // Mark all notifications as read
  app.put('/read-all', {
    preHandler: authenticate,
    handler: markAllNotificationsAsReadHandler,
  });

  // Delete notification
  app.delete('/:id', {
    preHandler: authenticate,
    handler: deleteNotificationHandler,
  });
}
