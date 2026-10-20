export const ErrorCodes = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

export type ErrorCodes = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCodes;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCodes = ErrorCodes.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', code: ErrorCodes = ErrorCodes.BAD_REQUEST) {
    super(message, 400, code, true);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code: ErrorCodes = ErrorCodes.UNAUTHORIZED) {
    super(message, 401, code, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code: ErrorCodes = ErrorCodes.FORBIDDEN) {
    super(message, 403, code, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code: ErrorCodes = ErrorCodes.NOT_FOUND) {
    super(message, 404, code, true);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code: ErrorCodes = ErrorCodes.CONFLICT) {
    super(message, 409, code, true);
  }
}
