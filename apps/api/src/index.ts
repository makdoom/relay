import { app } from "./app.js";
import { config } from "./config/index.js";
import { logger } from "./logger/index.js";
import { setupGraecfullShutdown } from "./shutdown.js";

const server = app.listen(config.port, config.host, () => {
  logger.info(`Server is running on http://${config.host}:${config.port}`);
});

setupGraecfullShutdown(server);
