import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import env from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import driverRoutes from './routes/driverRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import { ApiError } from './utils/asyncHandler.js';

const app = express();

app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(cookieParser());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/vehicles', vehicleRoutes);

app.use((req, res, next) => {
  next(new ApiError(404, 'The requested API route was not found.'));
});

app.use((error, req, res, next) => {
  const status = error.status || 500;

  res.status(status).json({
    error: error.message || 'Unexpected server error.',
    details: error.details || null,
  });
});

export default app;
