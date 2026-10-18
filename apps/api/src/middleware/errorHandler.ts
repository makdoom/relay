import { NextFunction, Request, Response } from "express";
import { AppError } from "../error/index.js";
import { logger } from "../logger/index.js";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof AppError) {
    logger.warn("Operational error encountered", {
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
    });

    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Unexpected / programmer error: log full stack internally, return generic error to client
  logger.error("Unhandled internal server error", {
    method: req.method,
    path: req.originalUrl || req.path,
    errorMessage: err.message,
    stack: err.stack,
  });

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred",
    },
  });
};
