import type { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../../error/index.js';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_MAX_AGE_MS,
  getClearCookieOptions,
  getCookieOptions,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_MAX_AGE_MS,
} from '../../utils/token.js';
import { loginSchema, registerSchema, serializeUser } from './auth.schema.js';
import { authService } from './auth.service.js';

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      throw new BadRequestError(firstIssue.message, 'VALIDATION_ERROR');
    }

    const createdUser = await authService.registerUser(parseResult.data);

    res.status(201).json({
      user: serializeUser(createdUser),
    });
  },

  /**
   * Handle user login HTTP request:
   * 1. Validates body against login Zod schema
   * 2. Authenticates credentials and generates tokens via auth service
   * 3. Attaches access_token and refresh_token in secure HttpOnly cookies
   * 4. Responds with HTTP 200 and serialized user DTO
   */
  async login(req: Request, res: Response): Promise<void> {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      throw new BadRequestError(firstIssue.message, 'VALIDATION_ERROR');
    }

    const { user, accessToken, rawRefreshToken } = await authService.loginUser(parseResult.data);

    res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE_MS));
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, rawRefreshToken,getCookieOptions(REFRESH_TOKEN_MAX_AGE_MS));

    res.status(200).json({
      user: serializeUser(user),
    });
  },

  /**
   * Handle refresh token rotation HTTP request:
   * 1. Extracts refresh_token cookie
   * 2. Rotates tokens via auth service (detects reuse & invalidates family if compromised)
   * 3. Sets refreshed access and refresh token cookies
   * 4. Responds with HTTP 200 and serialized user DTO
   */
  async refresh(req: Request, res: Response): Promise<void> {
    const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    const { user, accessToken, newRawRefreshToken } =
      await authService.refreshTokens(rawRefreshToken);

    res.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE_MS));
    res.cookie(
      REFRESH_TOKEN_COOKIE_NAME,
      newRawRefreshToken,
      getCookieOptions(REFRESH_TOKEN_MAX_AGE_MS)
    );

    res.status(200).json({
      user: serializeUser(user),
    });
  },

  /**
   * Handle user logout HTTP request:
   * 1. Extracts refresh_token cookie
   * 2. Revokes refresh token in database via auth service
   * 3. Clears both access_token and refresh_token cookies
   * 4. Responds with HTTP 200 confirmation
   */
  async logout(req: Request, res: Response): Promise<void> {
    const rawRefreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];

    await authService.logoutUser(rawRefreshToken);

    res.clearCookie(ACCESS_TOKEN_COOKIE_NAME, getClearCookieOptions());
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getClearCookieOptions());

    res.status(200).json({
      message: 'Logged out successfully',
    });
  },


  /**
   * Handle get current authenticated user profile:
   * 1. Derives authenticated user ID from req.user
   * 2. Retrieves user record via auth service
   * 3. Responds with HTTP 200 and serialized safe user DTO
   */
  async getMe(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required', 'UNAUTHORIZED');
    }

    const user = await authService.getCurrentUser(req.user.id);

    res.status(200).json({
      user: serializeUser(user),
    });
  },
};
