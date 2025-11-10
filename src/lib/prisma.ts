import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

class PrismaClientSingleton {
  private static instance: PrismaClient | null = null;

  static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: [
          { level: 'query', emit: 'event' },
          { level: 'error', emit: 'event' },
          { level: 'warn', emit: 'event' },
        ],
      });

      // Log queries in development
      if (process.env.NODE_ENV === 'development') {
        PrismaClientSingleton.instance.$on('query' as never, (e: any) => {
          logger.debug(`Query: ${e.query}`);
          logger.debug(`Duration: ${e.duration}ms`);
        });
      }

      PrismaClientSingleton.instance.$on('error' as never, (e: any) => {
        logger.error('Prisma error:', e);
      });

      PrismaClientSingleton.instance.$on('warn' as never, (e: any) => {
        logger.warn('Prisma warning:', e);
      });

      logger.info('✅ Prisma client initialized');
    }

    return PrismaClientSingleton.instance;
  }

  static async disconnect(): Promise<void> {
    if (PrismaClientSingleton.instance) {
      await PrismaClientSingleton.instance.$disconnect();
      PrismaClientSingleton.instance = null;
      logger.info('Prisma client disconnected');
    }
  }
}

export const prisma = PrismaClientSingleton.getInstance();
