import z from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(8000),
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z
      .string()
      .refine((url) => url.startsWith('postgresql://') || url.startsWith('postgres://'), {
        message:
          'DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql:// or postgres://',
      })
      .optional(),
    JWT_ACCESS_SECRETS: z
      .string()
      .min(32, 'JWT_ACCESS_SECRET must be at least 32 characters')
      .default('dev-jwt-access-secret-minimum-32-chars-long'),
    JWT_ACCESS_EXPIRATION: z.string().default('15m'),
    REFRESH_TOKEN_EXPIRATION_DAYS: z.coerce.number().int().positive().default(7),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      // Databse URL validation
      if (!data.DATABASE_URL) {
        ctx.addIssue({
          code: 'custom',
          path: ['DATABASE_URL'],
          message: 'DATABASE_URL is required in production',
        });
      } else if (data.DATABASE_URL.includes('localhost')) {
        ctx.addIssue({
          code: 'custom',
          message: 'DATABASE_URL should not be localhost in production',
          path: ['DATABASE_URL'],
        });
      }

      // JWT_ACCESS_SECRETS validation
      if (
        !data.JWT_ACCESS_SECRETS ||
        data.JWT_ACCESS_SECRETS === 'dev-jwt-access-secret-minimum-32-chars-long'
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
  jwt: {
    accessSecret: string;
    accessExpiration: string;
    refreshTokenExpirationDays: number;
  };
};

const validateConfig = (rawEnv: Record<string, string | undefined> = process.env) => {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`[config] Configuration validation failed:\n${errorDetails}`);
  }

  const {
    HOST,
    PORT,
    NODE_ENV,
    DATABASE_URL,
    JWT_ACCESS_SECRETS,
    JWT_ACCESS_EXPIRATION,
    REFRESH_TOKEN_EXPIRATION_DAYS,
  } = result.data;

  const defaultDbUrl =
    NODE_ENV === 'test'
      ? 'postgresql://postgres:postgres@localhost:5432/relay_test'
      : 'postgresql://postgres:postgres@localhost:5432/relay_dev';

  return {
    env: NODE_ENV,
    port: PORT,
    host: HOST,
    databaseUrl: DATABASE_URL ?? defaultDbUrl,
    jwt: {
      accessSecret: JWT_ACCESS_SECRETS,
      accessExpiration: JWT_ACCESS_EXPIRATION,
      refreshTokenExpirationDays: REFRESH_TOKEN_EXPIRATION_DAYS,
    },
  };
};

export const config = validateConfig();
