import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { usersController } from './users.controller.js';

export const userRouter: Router = Router();

// All user discovery routes require authentication
userRouter.use(authenticate);

userRouter.get('/search', asyncHandler(usersController.serchUsers));
userRouter.get('/:id', asyncHandler(usersController.getUserById));
