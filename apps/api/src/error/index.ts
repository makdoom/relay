export const ErrorCodes = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNPROCESSIBLE_ENTITY: 'UNPROCESSIBLE_ENTITY',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  USERNAME_ALREADY_EXISTS: 'USERNAME_ALREADY_EXISTS',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  INVALID_ACCESS_TOKEN: 'INVALID_ACCESS_TOKEN',
  ACCESS_TOKEN_EXPIRED: 'ACCESS_TOKEN_EXPIRED',
  REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',
  REFRESH_TOKEN_REQUIRED: 'REFRESH_TOKEN_REQUIRED',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
  TOKEN_REUSE_DETECTED: 'TOKEN_REUSE_DETECTED',

  CANNOT_CHAT_WITH_SELF: 'CANNOT_CHAT_WITH_SELF',
  NOT_A_MEMBER: 'NOT_A_MEMBER',
  MEMBER_NOT_FOUND: 'MEMBER_NOT_FOUND',
  MEMBER_ALREADY_EXISTS: 'MEMBER_ALREADY_EXISTS',
  DIRECT_CONVERSATION_IMMUTABLE: 'DIRECT_CONVERSATION_IMMUTABLE',
  MEMBER_DEPARTED: 'MEMBER_DEPARTED',
  ADMIN_ROLE_REQUIRED: 'ADMIN_ROLE_REQUIRED',
  CANNOT_SEND_TO_LEFT_CONVERSATION: 'CANNOT_SEND_TO_LEFT_CONVERSATION',
  CANNOT_LEAVE_DIRECT_CONVERSATION: 'CANNOT_LEAVE_DIRECT_CONVERSATION',
  ALREADY_LEFT_CONVERSATION: 'ALREADY_LEFT_CONVERSATION',
  SOLE_ADMIN_CANNOT_LEAVE: 'SOLE_ADMIN_CANNOT_LEAVE',
  MESSAGE_ACCESS_BOUNDED: 'MESSAGE_ACCESS_BOUNDED',
  CONVERSATION_NOT_FOUND: 'CONVERSATION_NOT_FOUND',
  CANNOT_JOIN_LEFT_CONVERSATION:'CANNOT_JOIN_LEFT_CONVERSATION',

  CURSOR_NOT_FOUND: 'CURSOR_NOT_FOUND',
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

export class UnprocessableEntityError extends AppError {
  constructor(
    message = 'Unprocessable Entity',
    code: ErrorCodes = ErrorCodes.UNPROCESSIBLE_ENTITY
  ) {
    super(message, 422, code, true);
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
