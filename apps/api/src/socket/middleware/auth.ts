import { UnauthorizedError } from "../../error/index.js";
import { ACCESS_TOKEN_COOKIE_NAME, verifyAccessToken } from "../../utils/token.js";
import { AppSocket, SocketAuthError } from "../types.js";


const parseCookies = (cookieHeader?: string): Record<string, string> => {
  const cookies: Record<string, string> = {}
  if(!cookieHeader || typeof cookieHeader !== 'string') return cookies

  const pairs = cookieHeader.split(';');
  for(const pair of pairs) {
    const trimmed = pair.trim();
    const equalsIndex = trimmed.indexOf('=');

    // Extracting tokens
    if (!trimmed || equalsIndex <= 0) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    const rawVal = trimmed.slice(equalsIndex + 1).trim();

    try {
      cookies[key] = decodeURIComponent(rawVal);
    } catch {
      cookies[key] = rawVal;
    }
  }

  return cookies
}

/**
 * Extracts JWT access token from Socket handshake in priority order:
 * 1. socket.handshake.auth.token
 * 2. HttpOnly cookie (access_token)
 * 3. socket.handshake.headers.authorization (Bearer <token>)
 */
const extractSocketToken = (socket: AppSocket): string | undefined => {
  // 1. Handshake auth object (Socket.IO client payload)
  const authToken = socket.handshake.auth?.token
  if(typeof authToken == 'string' && authToken.trim()){
    const trimmed = authToken.trim();
    return trimmed.startsWith('Bearer ') ? trimmed.slice(7).trim() : trimmed;
  }

  // 2. Cookie header (browser clients)
  const cookieHeader = socket.handshake.headers.cookie
  if(cookieHeader) {
    const parsedCookies = parseCookies(cookieHeader);
    const token = parsedCookies[ACCESS_TOKEN_COOKIE_NAME];
    if (token && typeof token === 'string' && token.trim()) {
      return token.trim();
    }
  }

  // 3. Authorization header (custom or non-browser clients)
  const authHeader = socket.handshake.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.trim().startsWith('Bearer ')) {
      const token = authHeader.trim().slice(7).trim();
      if (token) {
        return token;
      }
    }

  return undefined;
}

/**
 * Socket.IO handshake authentication middleware.
 * Verifies JWT access token before connection establishment.
 * Attaches verified user context to socket.data.user.
 * Rejects unauthenticated connections with structured 401 error.
 */
export const socketAuthMiddleware = (socket: AppSocket, next: (error?: SocketAuthError) => void): void => {
  try {
    const token = extractSocketToken(socket);
    if(!token) {
      const err = new UnauthorizedError('Authentication token required', 'UNAUTHORIZED') as SocketAuthError
      err.data = { code: 'AUTHENTICATION_REQUIRED', statusCode: 401 };
      return next(err)
    }
    
    const payload = verifyAccessToken(token);
    socket.data.user = { id: payload.sub };
    return next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      const err = error as SocketAuthError;
      err.data = { code: error.code, statusCode: error.statusCode };
      return next(err);
    }

    const err = new UnauthorizedError('Invalid access token','INVALID_ACCESS_TOKEN') as SocketAuthError;
    err.data = { code: 'INVALID_ACCESS_TOKEN', statusCode: 401 };
    return next(err);
  }
}