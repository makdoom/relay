import type { NextFunction, Request, Response } from 'express';
import { logger } from '../logger/index.js';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - start;

    logger.info('HTTP Request', {
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
};
