import type { NextFunction, Request, Response } from 'express';
import { v7 as uuidv7 } from 'uuid';
import { runWithContext } from '../observability/context.js';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Middleware that extracts or generates a unique correlation identifier (UUIDv7)
 * for every incoming HTTP request, attaches it to req.id, sets the X-Request-Id
 * response header, and binds it to the current AsyncLocalStorage context.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.headers[REQUEST_ID_HEADER] || req.headers['x-correlation-id'];

  let requestId: string;
  if (typeof incomingId === 'string' && incomingId.trim().length > 0 && incomingId.length <= 128) {
    requestId = incomingId.trim();
  } else {
    requestId = uuidv7();
  }

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);

  runWithContext({ requestId, userId: req.user?.id }, () => {
    next();
  });
}
