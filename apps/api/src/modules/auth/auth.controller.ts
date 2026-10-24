import type { Request, Response } from 'express';
import { BadRequestError } from '../../error/index.js';
import { registerSchema, serializeUser } from './auth.schema.js';
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
};
