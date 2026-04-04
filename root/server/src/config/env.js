import dotenv from 'dotenv';

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI || '',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'fleettrack-access-dev-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'fleettrack-refresh-dev-secret',
  accessTokenTtlSeconds: 60 * 15,
  refreshTokenTtlDaysDefault: 7,
  refreshTokenTtlDaysRememberMe: 30,
  refreshCookieName: 'fleettrack_refresh',
};

env.isProduction = env.nodeEnv === 'production';

export function assertEnv() {
  if (!env.mongoUri) {
    throw new Error('MONGODB_URI is required to start the FleetTrack backend.');
  }
}

export default env;
