const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'refreshtoken',
  'accesstoken',
  'authorization',
  'cookie',
  'secret',
  'apikey',
  'credentials',
]);

type ContextType = Record<string, unknown> | undefined;

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const sanitizeContext = (data: unknown): unknown => {
  if (data === null || data === undefined || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeContext(item));
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = '*****';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeContext(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

const formatLog = (level: LogLevel, message: string, context: ContextType) => {
  const logEntry = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...(context ? { context: sanitizeContext(context) } : {}),
  };

  return JSON.stringify(logEntry);
};

export const logger = {
  info(message: string, context?: ContextType): void {
    console.log(formatLog('info', message, context));
  },
  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(formatLog('warn', message, context));
  },
  error(message: string, context?: Record<string, unknown>): void {
    console.error(formatLog('error', message, context));
  },
  debug(message: string, context?: Record<string, unknown>): void {
    console.debug(formatLog('debug', message, context));
  },
};
