import type { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../../error/index.js';
import { searchUsersQuerySchema, userParamsSchema } from './users.schema.js';
import { usersService } from './users.service.js';

export const usersController = {
  /**
   * Search users matching query term (q) across username and name:
   * 1. Requires authenticated user (req.user.id)
   * 2. Validates query parameters using Zod
   * 3. Invokes users service to fetch safe user profiles (excluding requester)
   * 4. Responds with HTTP 200 and safe public user profiles
   */

  async serchUsers(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) throw new UnauthorizedError('Authentication required', 'UNAUTHORIZED');

    const parseResult = searchUsersQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      throw new BadRequestError(firstIssue.message, 'VALIDATION_ERROR');
    }

    const users = await usersService.searchUsers({
      currentUserId: req.user.id,
      query: parseResult.data.q,
      limit: parseResult.data.limit,
    });

    res.status(200).json({ users });
  },

  /**
   * Get safe public profile of a user by UUID:
   * 1. Requires authenticated user
   * 2. Validates route param UUID
   * 3. Invokes users service (throws 404 if not found)
   * 4. Responds with HTTP 200 and safe public profile
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required', 'UNAUTHORIZED');
    }

    const parseResult = userParamsSchema.safeParse(req.params);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      throw new BadRequestError(firstIssue.message, 'VALIDATION_ERROR');
    }

    const user = await usersService.getUserById(parseResult.data.id);

    res.status(200).json({
      user,
    });
  },
};
