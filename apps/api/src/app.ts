import cookieParser from 'cookie-parser';
import express, { type Application } from 'express';
import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { apiRateLimitMiddleware } from './middleware/rateLimiter.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { requestLogger } from './middleware/requestLogger.js';
import { authRouter } from './modules/auth/auth.route.js';
import { conversationsRouter } from './modules/conversations/conversations.route.js';
import { healthRouter } from './modules/health/health.route.js';
import { userRouter } from './modules/users/users.route.js';

export function createApp(): Application {
  const app = express();

  // Correlation ID & distributed context middleware (Milestone 8.3)
  app.use(requestIdMiddleware);

  // Baseline request logging and metrics instrumentation
  app.use(requestLogger);

  // Body parsing with strict payload size limit (Milestone 8.2)
  app.use(express.json({ limit: config.bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.bodyLimit }));

  // Cookie parsing
  app.use(cookieParser());

  // Health checks and Prometheus metrics (unthrottled operational endpoints)
  app.use('/health', healthRouter);
  // app.use('/metrics', metricsRouter);

  // Global API rate limiting (Milestone 8.2)
  app.use('/api/v1', apiRateLimitMiddleware);

  // API Routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/conversations', conversationsRouter);

  // 404 Catch-All
  app.use(notFoundHandler);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}

export const app = createApp();
