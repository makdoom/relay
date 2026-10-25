import type { Request, Response } from 'express';
import { BadRequestError, UnauthorizedError } from '../../error/index.js';
import {
  addMemberSchema,
  conversationIdParamSchema,
  createDirectConversationSchema,
  createGroupConversationSchema,
  listConversationsQuerySchema,
  memberParamSchema,
  updateGroupSchema,
} from './conversations.schema.js';
import { conversationsService } from './conversations.service.js';

export const conversationsController = {
  // Create or open an existing direct conversation with a recipient.
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

  // List active conversations for the authenticated user.
  async listConversations(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) throw new UnauthorizedError('Authentication required', 'UNAUTHORIZED');

    const parseResult = listConversationsQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      throw new BadRequestError(firstIssue.message, 'VALIDATION_ERROR');
    }

    const conversations = await conversationsService.listConversations({
      currentUserId: req.user.id,
      limit: parseResult.data.limit,
    });

    res.status(200).json({
      conversations,
    });
  },

  // Create a group conversation
  async createGroup(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required', 'UNAUTHORIZED');
    }

    const parseResult = createGroupConversationSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      throw new BadRequestError(firstIssue.message, 'VALIDATION_ERROR');
    }

    const conversation = await conversationsService.createGroupConversation({
      currentUserId: req.user.id,
      title: parseResult.data.title,
      memberIds: parseResult.data.memberIds,
    });

    res.status(201).json({
      conversation,
    });
  },

  /**
   * Add a member to a group conversation (admin only).
   */
  async addMember(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required', 'UNAUTHORIZED');
    }

    const paramResult = conversationIdParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      const firstIssue = paramResult.error.issues[0];
      throw new BadRequestError(firstIssue.message, 'VALIDATION_ERROR');
    }

    const bodyResult = addMemberSchema.safeParse(req.body);
    if (!bodyResult.success) {
      const firstIssue = bodyResult.error.issues[0];
      throw new BadRequestError(firstIssue.message, 'VALIDATION_ERROR');
    }

    const member = await conversationsService.addMemberToGroup({
      conversationId: paramResult.data.id,
      currentUserId: req.user.id,
      targetUserId: bodyResult.data.userId,
    });

    res.status(201).json({
      member,
    });
  },

  /**
   * Remove a member from a group conversation (admin only).
   */
  async removeMember(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required', 'UNAUTHORIZED');
    }

    const paramResult = memberParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      const firstIssue = paramResult.error.issues[0];
      throw new BadRequestError(firstIssue.message, 'VALIDATION_ERROR');
    }

    const result = await conversationsService.removeMemberFromGroup({
      conversationId: paramResult.data.id,
      currentUserId: req.user.id,
      targetUserId: paramResult.data.userId,
    });

    res.status(200).json(result);
  },

  /**
   * Voluntarily leave a group conversation.
   */
  async leaveGroup(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required', 'UNAUTHORIZED');
    }

    const paramResult = conversationIdParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      const firstIssue = paramResult.error.issues[0];
      throw new BadRequestError(firstIssue.message, 'VALIDATION_ERROR');
    }

    const result = await conversationsService.leaveGroup({
      conversationId: paramResult.data.id,
      currentUserId: req.user.id,
    });

    res.status(200).json(result);
  },

  /**
   * Update group details (e.g. title) (admin only).
   */
  async updateGroup(req: Request, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new UnauthorizedError('Authentication required', 'UNAUTHORIZED');
    }

    const paramResult = conversationIdParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      const firstIssue = paramResult.error.issues[0];
      throw new BadRequestError(firstIssue.message, 'VALIDATION_ERROR');
    }

    const bodyResult = updateGroupSchema.safeParse(req.body);
    if (!bodyResult.success) {
      const firstIssue = bodyResult.error.issues[0];
      throw new BadRequestError(firstIssue.message, 'VALIDATION_ERROR');
    }

    const conversation = await conversationsService.updateGroup({
      conversationId: paramResult.data.id,
      currentUserId: req.user.id,
      title: bodyResult.data.title,
    });

    res.status(200).json({
      conversation,
    });
  },
};
