import { buildApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';

async function startServer() {
  try {
    const app = await buildApp();

    await app.listen({
      port: config.server.port,
      host: config.server.host,
    });

    logger.info(
      `🚀 Sip-It API server running on http://${config.server.host}:${config.server.port}`
    );

    // Graceful shutdown
    const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, closing server gracefully...`);
        await app.close();
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Error starting server:');
    console.error(error);
    process.exit(1);
  }
}

startServer();
