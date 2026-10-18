import z from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8000),
  HOST: z.string().default('0.0.0.0'),
});

export type Config = {
  env: 'development' | 'production' | 'test';
  port: number;
  host: string;
};

const validateConfig = (rawEnv: Record<string, string | undefined> = process.env) => {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`[config] Configuration validation failed:\n${errorDetails}`);
  }

  const { HOST, PORT, NODE_ENV } = result.data;

  return {
    env: NODE_ENV,
    port: PORT,
    host: HOST,
  };
};

export const config = validateConfig();
