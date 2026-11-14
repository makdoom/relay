import type { CorsOptions } from 'cors';
import { config } from '../config/index.js';

/**
 * Validates whether an incoming HTTP request origin or Socket.IO handshake origin
 * is permitted by CORS policies.
 */
export const isOriginAllowed = (requestOrigin?: string): boolean => {
  // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
  if (!requestOrigin) return true;

  const cleanOrigin = requestOrigin.trim().replace(/\/$/, '');
  const configuredOrigins = config.cors.origin
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  // Exact match with configured origin(s) or wildcard
  if (configuredOrigins.includes(cleanOrigin) || configuredOrigins.includes('*')) {
    return true;
  }

  // Local development origins
  if (
    config.env === 'development' &&
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin)
  ) {
    return true;
  }

  // Allow Vercel deployment domains (production, preview, and branch deployments)
  if (/\.vercel\.app$/.test(cleanOrigin)) {
    return true;
  }

  return false;
};

export const corsOptions: CorsOptions = {
  origin: (requestOrigin, callback) => {
    if (isOriginAllowed(requestOrigin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'x-request-id',
    'x-client-timestamp',
  ],
  exposedHeaders: ['Set-Cookie', 'x-request-id'],
};
