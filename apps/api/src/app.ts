import express, { type Application } from 'express';

const createApp = (): Application => {
  const app = express();

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  return app;
};

export const app = createApp();
