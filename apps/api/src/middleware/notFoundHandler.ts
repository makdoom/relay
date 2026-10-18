import { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../error/index.js";

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  next(new NotFoundError(`Route ${req.method} ${req.path} not found`));
};
