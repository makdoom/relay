import type { Request, Response } from 'express';
import { conversationsService } from './conversations.service.js';
import { createDirectConversationSchema } from './conversations.schema.js';
import { BadRequestError, UnauthorizedError } from '../../error/index.js';

export const conversationsController = {
  /**
   * Create or open an existing direct conversation with a recipient:
   * 1. Requires authenticated user (req.user.id)
   * 2. Validates recipientId in request body
   * 3. Invokes conversations service (resolves deterministically)
   * 4. Responds with HTTP 201 (new) or HTTP 200 (existing)
   */
  async createOrGetDirect(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) throw new UnauthorizedError('Authentication required', 'UNAUTHORIZED');

    const parseResult = createDirectConversationSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      throw new BadRequestError(firstIssue.message, 'VALIDATION_ERROR');
    }

    const { conversation, isNew } = await conversationsService.getOrCreateDirectConversation({
      currentUserId: req.user.id,
      recipientId: parseResult.data.recipientId,
    });

    res.status(isNew ? 201 : 200).json({
      conversation,
    });
  },
};
