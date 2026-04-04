import mongoose from 'mongoose';
import env from '../config/env.js';

const MONGO_SERVER_SELECTION_TIMEOUT_MS = 10_000;
const MONGO_CONNECT_TIMEOUT_MS = 10_000;
let hasRegisteredConnectionListeners = false;

function registerConnectionListeners() {
  if (hasRegisteredConnectionListeners) {
    return;
  }

  hasRegisteredConnectionListeners = true;

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connected');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. FleetTrack will keep retrying in the background.');
  });

  mongoose.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error.message);
  });
}

export async function connectToDatabase() {
  mongoose.set('strictQuery', true);
  registerConnectionListeners();

  try {
    await mongoose.connect(env.mongoUri, {
      connectTimeoutMS: MONGO_CONNECT_TIMEOUT_MS,
      family: 4,
      serverSelectionTimeoutMS: MONGO_SERVER_SELECTION_TIMEOUT_MS,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to connect to MongoDB within ${MONGO_SERVER_SELECTION_TIMEOUT_MS}ms. ${message}`
    );
  }
}
