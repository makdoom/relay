import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { messagesRouter } from '../messages/messages.route.js';
import { conversationsController } from './conversations.controller.js';

export const conversationsRouter: Router = Router();

// All conversation routes require authentication
conversationsRouter.use(authenticate);

conversationsRouter.get('/', asyncHandler(conversationsController.listConversations));
conversationsRouter.post('/direct', asyncHandler(conversationsController.createOrGetDirect));
conversationsRouter.post('/group', asyncHandler(conversationsController.createGroup));
conversationsRouter.patch('/:id', asyncHandler(conversationsController.updateGroup));
conversationsRouter.post('/:id/members', asyncHandler(conversationsController.addMember));
conversationsRouter.delete(
  '/:id/members/:userId',
  asyncHandler(conversationsController.removeMember)
);
conversationsRouter.post('/:id/leave', asyncHandler(conversationsController.leaveGroup));

// Nested message routes
conversationsRouter.use('/:conversationId/messages', messagesRouter);
