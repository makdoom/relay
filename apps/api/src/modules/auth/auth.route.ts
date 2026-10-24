import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authController } from './auth.controller.js';

export const authRouter: Router = Router();

authRouter.post('/register', asyncHandler(authController.register));
authRouter.post('/login', asyncHandler(authController.login));
authRouter.post('/refresh', asyncHandler(authController.refresh));
authRouter.post('/logout', asyncHandler(authController.logout));
