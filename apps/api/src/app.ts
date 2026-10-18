import express, { type Application } from 'express';
import { healthRouter } from './routes/health.js';

const createApp = (): Application => {
  const app = express();

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/health', healthRouter);

  return app;
};

export const app = createApp();
