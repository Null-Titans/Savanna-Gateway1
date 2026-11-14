import type { Server } from 'http';
import { app } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './shared/logger.js';

let server: Server | null = null;
let isShuttingDown = false;

async function bootstrap(): Promise<void> {
  try {
    logger.info(`Starting Savanna Gateway Backend in [${env.NODE_ENV}] mode...`);

    // 1. Establish resilient database connection
    try {
      await connectDatabase();
    } catch (dbErr) {
      if (env.NODE_ENV === 'production') {
        throw dbErr;
      }
      logger.warn(
        { err: dbErr instanceof Error ? dbErr.message : dbErr },
        'MongoDB is not reachable; proceeding in degraded mode for development'
      );
    }

    // 2. Start HTTP Listener
    server = app.listen(env.PORT, '0.0.0.0', () => {
      logger.info(
        {
          port: env.PORT,
          apiPrefix: env.API_PREFIX,
          healthEndpoint: `http://localhost:${env.PORT}/health`,
          versionedHealth: `http://localhost:${env.PORT}${env.API_PREFIX}/health`,
        },
        `HTTP Server listening on http://0.0.0.0:${env.PORT}`
      );
    });

    // Handle Server-Level Errors
    server.on('error', (err) => {
      logger.fatal({ err }, 'Fatal HTTP server error');
      gracefulShutdown('SERVER_ERROR');
    });
  } catch (err) {
    logger.fatal({ err }, 'Failed to bootstrap application server');
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;

  logger.info(`Received [${signal}]. Initiating graceful shutdown sequence...`);

  // Force termination if graceful shutdown stalls
  const forceExitTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out (10s limit exceeded). Forcing exit.');
    process.exit(1);
  }, 10000);
  forceExitTimeout.unref();

  try {
    // 1. Stop accepting new HTTP connections
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((err) => {
          if (err) return reject(err);
          logger.info('HTTP server stopped accepting connections');
          resolve();
        });
      });
    }

    // 2. Disconnect database
    await disconnectDatabase();

    clearTimeout(forceExitTimeout);
    logger.info('Graceful shutdown completed cleanly.');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Error occurred during graceful shutdown');
    clearTimeout(forceExitTimeout);
    process.exit(1);
  }
}

// Process Signals and Uncaught Exceptions
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err: Error) => {
  logger.fatal({ err: { message: err.message, stack: err.stack } }, 'Uncaught Exception detected');
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.fatal({ reason }, 'Unhandled Promise Rejection detected');
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Launch server
bootstrap();
