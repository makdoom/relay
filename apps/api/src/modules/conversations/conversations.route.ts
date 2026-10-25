import { Router } from 'express';
import { conversationsController } from './conversations.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authenticate } from '../../middleware/authenticate.js';

export const conversationsRouter: Router = Router();

// All conversation routes require authentication
conversationsRouter.use(authenticate);

conversationsRouter.get('/', asyncHandler(conversationsController.listConversations));
conversationsRouter.post('/direct', asyncHandler(conversationsController.createOrGetDirect));
