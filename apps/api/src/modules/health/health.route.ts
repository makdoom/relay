import { type Request, type Response, Router } from 'express';
import { checkDatabaseConnection } from '../../db/index.js';
import { shutdownManager } from '../../shutdown.js';
import { getRedisStatus } from '../../socket/index.js';
import type { AppSocketServer } from '../../socket/types.js';

export const healthRouter: Router = Router();

healthRouter.get('/', async (req: Request, res: Response) => {
  const dbStatus = await checkDatabaseConnection(undefined, 2000);
  const io = req.app.get('io') as AppSocketServer | undefined;
  const redisStatus = getRedisStatus(io);

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: dbStatus.ok ? 'connected' : 'disconnected',
      redis: redisStatus.configured
        ? redisStatus.connected
          ? 'connected'
          : 'degraded'
        : 'disabled',
    },
  });
});

healthRouter.get('/ready', async (req: Request, res: Response) => {
  if (shutdownManager.getIsShuttingDown()) {
    res.status(503).json({
      status: 'shutting_down',
      timestamp: new Date().toISOString(),
      services: {
        database: 'shutting_down',
      },
    });
    return;
  }

  const dbStatus = await checkDatabaseConnection(undefined, 2000);
  const io = req.app.get('io') as AppSocketServer | undefined;
  const redisStatus = getRedisStatus(io);

  if (dbStatus.ok) {
    const isRedisDegraded = redisStatus.configured && !redisStatus.connected;
    res.status(200).json({
      status: isRedisDegraded ? 'degraded' : 'ready',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: redisStatus.configured
          ? redisStatus.connected
            ? 'connected'
            : 'degraded'
          : 'disabled',
      },
    });
  } else {
    res.status(503).json({
      status: 'unavailable',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        redis: redisStatus.configured
          ? redisStatus.connected
            ? 'connected'
            : 'degraded'
          : 'disabled',
      },
      error: dbStatus.error,
    });
  }
});
