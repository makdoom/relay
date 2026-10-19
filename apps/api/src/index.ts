import "dotenv/config";

import { app } from "./app.js";
import { config } from "./config/index.js";
import { logger } from "./logger/index.js";
import { setupGracefullShutdown, shutdownManager } from "./shutdown.js";
import {
  checkDatabaseConnection,
  closeDatabaseConnection,
} from "./db/index.js";

async function startServer(): Promise<void> {
  const status = await checkDatabaseConnection(undefined, 3000);

  if (!status.ok) {
    logger.error("Database unavailable. Server startup aborted.", {
      error: status.error,
    });

    await closeDatabaseConnection();
    process.exitCode = 1;
    return;
  }

  logger.info("Database connection established", {
    latencyMs: status.latencyMs,
  });

  const server = app.listen(config.port, config.host, () => {
    logger.info(`Server is running on http://${config.host}:${config.port}`);
  });

  server.on("error", (err) => {
    logger.error("HTTP server failed", { error: err.message });
  });

  shutdownManager.registerCleanup("db-pool", () => closeDatabaseConnection());

  setupGracefullShutdown(server);
}

void startServer().catch((err: unknown) => {
  logger.error("Application startup failed", {
    error: err instanceof Error ? err.message : String(err),
  });

  process.exitCode = 1;
});
