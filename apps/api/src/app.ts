import express, { type Application } from "express";
import { healthRouter } from "./routes/health.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import { errorHandler } from "./middleware/errorHandler.js";

const createApp = (): Application => {
  const app = express();

  // Baseline request logging
  app.use(requestLogger);

  // Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use("/health", healthRouter);

  // 404 Catch-All
  app.use(notFoundHandler);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
};

export const app = createApp();
