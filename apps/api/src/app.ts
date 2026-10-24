import cookieParser from 'cookie-parser';
import express, { type Application } from 'express';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authRouter } from './modules/auth/auth.route.js';
import { healthRouter } from './modules/health/health.route.js';

const createApp = (): Application => {
  const app = express();

  // Baseline request logging
  app.use(requestLogger);

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Routes
  app.use('/health', healthRouter);
  app.use('/api/v1/auth', authRouter);

  // 404 Catch-All
  app.use(notFoundHandler);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};

export const app = createApp();
