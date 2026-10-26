import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authenticate } from "../../middleware/authenticate.js";
import { messagesController } from "./messages.controller.js";

export const messagesRouter: Router = Router({mergeParams: true})

// Message routes require authentication
messagesRouter.use(authenticate);

messagesRouter.post('/', asyncHandler(messagesController.sendMessage))