// Vitest global setup for integration tests: in‑memory MongoDB instance
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  // Start in‑memory server
  mongod = await MongoMemoryServer.create();
  // Override env variable used by the DB manager
  process.env.MONGODB_URI = mongod.getUri();
  // Establish connection using the project's DB manager
  await connectDatabase();
});

afterAll(async () => {
  // Close Mongoose connection and shut down the in‑memory server
  await disconnectDatabase();
  if (mongod) await mongod.stop();
});

afterEach(async () => {
  // Clear all collections to ensure test isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
