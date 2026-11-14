import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../shared/logger.js';

interface DatabaseHealth {
  connected: boolean;
  state: 'disconnected' | 'connected' | 'connecting' | 'disconnecting' | 'unknown';
  latencyMs: number | null;
  host?: string;
  name?: string;
}

const READY_STATES: Record<number, DatabaseHealth['state']> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

class DatabaseManager {
  private isConnected = false;
  private isConnecting = false;
  private retryCount = 0;
  private readonly maxRetries = 5;
  private readonly initialRetryDelayMs = 1000;

  constructor() {
    this.registerMongooseEvents();
  }

  private registerMongooseEvents(): void {
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      this.isConnecting = false;
      this.retryCount = 0;
      logger.info(
        { host: mongoose.connection.host, db: mongoose.connection.name },
        'MongoDB connected successfully'
      );
    });

    mongoose.connection.on('error', (err) => {
      this.isConnected = false;
      logger.error({ err }, 'MongoDB connection error encountered');
    });

    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      logger.warn('MongoDB connection disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      this.isConnected = true;
      logger.info('MongoDB reconnected successfully');
    });
  }

  public async connect(): Promise<void> {
    if (this.isConnected) {
      logger.debug('MongoDB already connected');
      return;
    }

    if (this.isConnecting) {
      logger.debug('MongoDB connection attempt already in progress');
      return;
    }

    this.isConnecting = true;
    await this.connectWithRetry();
  }

  private async connectWithRetry(): Promise<void> {
    const uri = env.MONGODB_URI;

    try {
      logger.info(`Attempting MongoDB connection (attempt ${this.retryCount + 1}/${this.maxRetries})...`);

      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        autoIndex: env.NODE_ENV !== 'production',
      });

      this.isConnected = true;
      this.isConnecting = false;
      this.retryCount = 0;
    } catch (error) {
      this.isConnected = false;
      this.retryCount += 1;

      const delay = Math.min(
        this.initialRetryDelayMs * Math.pow(2, this.retryCount - 1),
        10000
      );

      logger.error(
        {
          attempt: this.retryCount,
          maxRetries: this.maxRetries,
          nextRetryInMs: delay,
          err: error instanceof Error ? error.message : error,
        },
        'Failed to connect to MongoDB'
      );

      if (this.retryCount < this.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.connectWithRetry();
      }

      this.isConnecting = false;
      const failureMessage = `MongoDB connection failed after ${this.maxRetries} attempts`;
      logger.fatal(failureMessage);

      // In production, exit immediately if DB is unreachable on startup
      if (env.NODE_ENV === 'production') {
        throw new Error(failureMessage);
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isConnected && mongoose.connection.readyState === 0) {
      return;
    }

    try {
      logger.info('Closing MongoDB connection gracefully...');
      await mongoose.connection.close(false);
      this.isConnected = false;
      logger.info('MongoDB connection closed cleanly');
    } catch (err) {
      logger.error({ err }, 'Error during MongoDB graceful disconnection');
      throw err;
    }
  }

  public async getHealth(): Promise<DatabaseHealth> {
    const rawState = mongoose.connection.readyState;
    const state = READY_STATES[rawState] ?? 'unknown';
    const isReady = rawState === 1;

    let latencyMs: number | null = null;
    if (isReady && mongoose.connection.db) {
      try {
        const start = Date.now();
        await mongoose.connection.db.admin().ping();
        latencyMs = Date.now() - start;
      } catch {
        latencyMs = null;
      }
    }

    return {
      connected: isReady,
      state,
      latencyMs,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
}

export const db = new DatabaseManager();
export const connectDatabase = (): Promise<void> => db.connect();
export const disconnectDatabase = (): Promise<void> => db.disconnect();
export const getDatabaseHealth = (): Promise<DatabaseHealth> => db.getHealth();
