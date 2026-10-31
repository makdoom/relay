import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../error/index.js';

type AccessTokenPayload = {
  sub: string;
};

export const ACCESS_TOKEN_COOKIE_NAME = 'access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token';

export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
export const REFRESH_TOKEN_MAX_AGE_MS = config.jwt.refreshTokenExpirationDays * 24 * 60 * 60 * 1000; // 7 days

//  Signs a short-lived JWT access token with the configured secret and expiration.
export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiration as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
};

// Verifies a JWT access token and returns its decoded payload.
// Throws UnauthorizedError if token is invalid or expired.
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret, {
      algorithms: ['HS256'],
    }) as jwt.JwtPayload & AccessTokenPayload;
    if (!decoded.sub || typeof decoded.sub !== 'string')
      throw new UnauthorizedError('Invalid access token payload', 'INVALID_ACCESS_TOKEN');

    return {
      sub: decoded.sub,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;

    if (error instanceof jwt.TokenExpiredError)
      throw new UnauthorizedError('Access Token Expired', 'ACCESS_TOKEN_EXPIRED');

    throw new UnauthorizedError('Invalid access token', 'INVALID_ACCESS_TOKEN');
  }
};

// Generates an unguessable, cryptographically secure 256-bit random refresh token.
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Computes the deterministic SHA-256 hash of a token for secure database storage.
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Helper to produce standard secure cookie options.
export const getCookieOptions = (maxAgeMs: number) => {
  return {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: (config.env === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    maxAge: maxAgeMs,
  };
};

// Helper to produce standard cookie clearing options.
export const getClearCookieOptions = () => {
  return {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: (config.env === 'production' ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  };
};
