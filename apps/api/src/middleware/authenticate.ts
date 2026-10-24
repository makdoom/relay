import type { NextFunction, Request, Response } from "express";
import { ACCESS_TOKEN_COOKIE_NAME, verifyAccessToken } from "../utils/token.js";
import { UnauthorizedError } from "../error/index.js";

// Extracts the access token from cookies or the Authorization: Bearer header.
const extractToken = (req:Request)=>{
  // 1. Try cookie first (primary transport for browser client)
  if (req.cookies && req.cookies[ACCESS_TOKEN_COOKIE_NAME]) {
    return req.cookies[ACCESS_TOKEN_COOKIE_NAME];
  }

  // 2. Try Authorization: Bearer <token> header (API / mobile / testing fallback)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    return token.length > 0 ? token : undefined;
  }

  return undefined;
}


/**
 * Reusable Express authentication middleware:
 * 1. Extracts the access token from cookies or Authorization header
 * 2. Cryptographically verifies the JWT signature and expiration
 * 3. Derives the authenticated user ID and attaches it to req.user
 * 4. Forwards to next() or passes UnauthorizedError to error handler
 */
export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req)
    if(!token) throw new UnauthorizedError('Authentication token required', 'UNAUTHORIZED');

    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
    };

    next();

  } catch (error) {
    next(error)
  }
}