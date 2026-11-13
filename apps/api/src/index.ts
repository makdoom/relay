import { createServer } from 'node:http';
import { app } from './app.js';
import { config } from './config/index.js';
import { checkDatabaseConnection, closeDatabaseConnection } from './db/index.js';
import { logger } from './logger/index.js';
import { setupGracefullShutdown, shutdownManager } from './shutdown.js';
import { createSocketServer } from './socket/index.js';

const server = createServer(app);
const io = createSocketServer(server);
app.set('io', io);

server.listen(config.port, config.host, () => {
  logger.info(`Server listening on http://${config.host}:${config.port} (${config.env})`, {
    port: config.port,
    host: config.host,
    env: config.env,
  });
});

setupGracefullShutdown(server);
shutdownManager.registerCleanup('db-pool', () => closeDatabaseConnection());
shutdownManager.registerCleanup(
  'socket-server',
  () =>
    new Promise<void>((resolve) => {
      io.close(() => resolve());
    })
);

// Non-blocking startup database check
void checkDatabaseConnection(undefined, 3000).then((status) => {
  if (status.ok) {
    logger.info('Database connection established', { latencyMs: status.latencyMs });
  } else {
    logger.warn('Database connection unavailable at startup. Server will retry on demand.', {
      error: status.error,
    });
  }
});

export { io, server };
