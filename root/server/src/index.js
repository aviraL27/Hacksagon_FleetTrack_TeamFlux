import http from 'node:http';
import app from './app.js';
import env, { assertEnv } from './config/env.js';
import { connectToDatabase } from './db/connect.js';
import { initializeSocket } from './services/socketService.js';

const INITIAL_CONNECT_RETRY_DELAY_MS = 5_000;

function wait(duration) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

async function connectToDatabaseWithRetry() {
  for (;;) {
    try {
      await connectToDatabase();
      return;
    } catch (error) {
      console.error('Initial MongoDB connection failed. Retrying in 5 seconds.');
      console.error(error);
      await wait(INITIAL_CONNECT_RETRY_DELAY_MS);
    }
  }
}

async function startServer() {
  assertEnv();
  await connectToDatabaseWithRetry();

  const server = http.createServer(app);
  initializeSocket(server, { corsOrigin: env.clientOrigin });

  server.listen(env.port, () => {
    console.log(`FleetTrack backend listening on port ${env.port}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
