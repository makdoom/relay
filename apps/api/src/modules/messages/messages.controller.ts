import type { Request, Response } from "express";
import { BadRequestError, UnauthorizedError } from "../../error/index.js";
import { conversationIdParamSchema, sendMessageSchema } from "./messages.schema.js";
import { messagesService } from "./messages.service.js";

export const messagesController = {
  // Validates message payload shape, derives authenticated sender, and authorizes conversation membership.
  async sendMessage(req:Request, res: Response): Promise<void>{
    if (!req.user?.id) throw new UnauthorizedError('Authentication required', 'UNAUTHORIZED');

    const paramResult = conversationIdParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      const firstIssue = paramResult.error.issues[0];
      throw new BadRequestError(firstIssue.message, 'VALIDATION_ERROR');
    }

    const bodyResult = sendMessageSchema.safeParse(req.body);
    if (!bodyResult.success) {
      const firstIssue = bodyResult.error.issues[0];
      throw new BadRequestError(firstIssue.message, 'VALIDATION_ERROR');
    }

    const createdMessage = await messagesService.sendMessage({
      conversationId: paramResult.data.conversationId,
      currentUserId: req.user.id,
      content: bodyResult.data.content,
      idempotencyKey: bodyResult.data.idempotencyKey,
    });

    res.status(201).json({
      message: createdMessage,
    });
  }
   
}