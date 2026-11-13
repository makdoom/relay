import { z } from 'zod';

// Load .env file if available (Node.js 20.6+)
try {
  process.loadEnvFile?.();
} catch {
  // Silently ignore if .env is missing (e.g. in CI or production container)
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z
      .string()
      .refine((url) => url.startsWith('postgresql://') || url.startsWith('postgres://'), {
        message:
          'DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql:// or postgres://',
      })
      .optional(),
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
    DATABASE_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(20),
    DATABASE_CONNECT_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(10),
    DATABASE_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),
    JWT_ACCESS_SECRET: z
      .string()
      .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters')
      .default('dev-jwt-access-secret-minimum-32-chars-long'),
    JWT_ACCESS_EXPIRATION: z.string().default('15m'),
    REFRESH_TOKEN_EXPIRATION_DAYS: z.coerce.number().int().positive().default(7),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    BODY_LIMIT: z.string().default('64kb'),
    RATE_LIMIT_ENABLED: z.coerce.boolean().default(true),
    RATE_LIMIT_AUTH_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15 * 60 * 1000), // 15 mins
    RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(20),
    RATE_LIMIT_API_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(60 * 1000), // 1 min
    RATE_LIMIT_API_MAX: z.coerce.number().int().positive().default(120),
    RATE_LIMIT_MESSAGE_WINDOW_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(10 * 1000), // 10s
    RATE_LIMIT_MESSAGE_MAX: z.coerce.number().int().positive().default(30),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      if (!data.DATABASE_URL) {
        ctx.addIssue({
          code: 'custom',
          path: ['DATABASE_URL'],
          message: 'DATABASE_URL is required in production',
        });
      } else if (data.DATABASE_URL.includes('localhost')) {
        ctx.addIssue({
          code: 'custom',
          path: ['DATABASE_URL'],
          message: 'DATABASE_URL must not target localhost in production',
        });
      }

      if (
        !data.JWT_ACCESS_SECRET ||
        data.JWT_ACCESS_SECRET === 'dev-jwt-access-secret-minimum-32-chars-long'
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['JWT_ACCESS_SECRET'],
          message: 'A secure JWT_ACCESS_SECRET is required in production',
        });
      }
    }
  });

export type Config = {
  env: 'development' | 'production' | 'test';
  port: number;
  host: string;
  databaseUrl: string;
  database: {
    url: string;
    poolMax: number;
    idleTimeoutSeconds: number;
    connectTimeoutSeconds: number;
    statementTimeoutMs: number;
  };
  bodyLimit: string;
  cors: {
    origin: string;
  };
  jwt: {
    accessSecret: string;
    accessExpiration: string;
    refreshTokenExpirationDays: number;
  };
  rateLimit: {
    enabled: boolean;
    authWindowMs: number;
    authMax: number;
    apiWindowMs: number;
    apiMax: number;
    messageWindowMs: number;
    messageMax: number;
  };
};

export function validateConfig(rawEnv: Record<string, string | undefined> = process.env): Config {
  const result = envSchema.safeParse(rawEnv);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`[config] Configuration validation failed:\n${errorDetails}`);
  }

  const {
    NODE_ENV,
    PORT,
    HOST,
    DATABASE_URL,
    DATABASE_POOL_MAX,
    DATABASE_IDLE_TIMEOUT_SECONDS,
    DATABASE_CONNECT_TIMEOUT_SECONDS,
    DATABASE_STATEMENT_TIMEOUT_MS,
    CORS_ORIGIN,
    BODY_LIMIT,
    RATE_LIMIT_ENABLED,
    RATE_LIMIT_AUTH_WINDOW_MS,
    RATE_LIMIT_AUTH_MAX,
    RATE_LIMIT_API_WINDOW_MS,
    RATE_LIMIT_API_MAX,
    RATE_LIMIT_MESSAGE_WINDOW_MS,
    RATE_LIMIT_MESSAGE_MAX,
    JWT_ACCESS_SECRET,
    JWT_ACCESS_EXPIRATION,
    REFRESH_TOKEN_EXPIRATION_DAYS,
  } = result.data;

  const defaultDbUrl =
    NODE_ENV === 'test'
      ? 'postgresql://postgres:postgres@localhost:5433/echo_test'
      : 'postgresql://postgres:postgres@localhost:5433/echo_dev';

  const dbUrl = DATABASE_URL ?? defaultDbUrl;

  return {
    env: NODE_ENV,
    port: PORT,
    host: HOST,
    databaseUrl: dbUrl,
    database: {
      url: dbUrl,
      poolMax: NODE_ENV === 'test' ? 5 : DATABASE_POOL_MAX,
      idleTimeoutSeconds: DATABASE_IDLE_TIMEOUT_SECONDS,
      connectTimeoutSeconds: DATABASE_CONNECT_TIMEOUT_SECONDS,
      statementTimeoutMs: DATABASE_STATEMENT_TIMEOUT_MS,
    },
    bodyLimit: BODY_LIMIT,
    cors: {
      origin: CORS_ORIGIN,
    },
    jwt: {
      accessSecret: JWT_ACCESS_SECRET,
      accessExpiration: JWT_ACCESS_EXPIRATION,
      refreshTokenExpirationDays: REFRESH_TOKEN_EXPIRATION_DAYS,
    },
    rateLimit: {
      enabled: RATE_LIMIT_ENABLED,
      authWindowMs: RATE_LIMIT_AUTH_WINDOW_MS,
      authMax: RATE_LIMIT_AUTH_MAX,
      apiWindowMs: RATE_LIMIT_API_WINDOW_MS,
      apiMax: RATE_LIMIT_API_MAX,
      messageWindowMs: RATE_LIMIT_MESSAGE_WINDOW_MS,
      messageMax: RATE_LIMIT_MESSAGE_MAX,
    },
  };
}

export const config = validateConfig();
