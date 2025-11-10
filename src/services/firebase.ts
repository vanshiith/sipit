import admin from 'firebase-admin';
import { logger } from '../utils/logger';
import * as path from 'path';

class FirebaseService {
  private initialized = false;

  initialize() {
    if (this.initialized) return;

    try {
      // Check if app already exists
      if (admin.apps.length > 0) {
        this.initialized = true;
        logger.info('✅ Firebase Admin already initialized');
        return;
      }

      // Use service account JSON file directly
      const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');
      const serviceAccount = require(serviceAccountPath);

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      this.initialized = true;
      logger.info('✅ Firebase Admin initialized with service account JSON');
    } catch (error: any) {
      logger.error('Failed to initialize Firebase Admin:', error);
      throw error;
    }
  }

  async sendNotification(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      const message: admin.messaging.Message = {
        notification: {
          title,
          body,
        },
        data,
        token: deviceToken,
      };

      await admin.messaging().send(message);
      logger.info(`Notification sent to ${deviceToken}`);
      return true;
    } catch (error) {
      logger.error('Failed to send notification:', error);
      return false;
    }
  }

  async sendMulticastNotification(
    deviceTokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.initialized) {
      this.initialize();
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title,
          body,
        },
        data,
        tokens: deviceTokens,
      };

      const response = await admin.messaging().sendMulticast(message);
      logger.info(
        `Multicast notification sent. Success: ${response.successCount}, Failed: ${response.failureCount}`
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      logger.error('Failed to send multicast notification:', error);
      return { successCount: 0, failureCount: deviceTokens.length };
    }
  }
}

export const firebaseService = new FirebaseService();
