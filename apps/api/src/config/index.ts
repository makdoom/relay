import z from "zod";

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(8000),
    HOST: z.string().default("0.0.0.0"),
    DATABASE_URL: z
      .string()
      .refine(
        (url) =>
          url.startsWith("postgresql://") || url.startsWith("postgres://"),
        {
          message:
            "DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql:// or postgres://",
        },
      )
      .default("postgresql://postgres:postgres@localhost:5432/relay_dev"),
  })
  .superRefine((data, ctx) => {
    if (
      data.NODE_ENV === "production" &&
      data.DATABASE_URL.includes("localhost")
    ) {
      ctx.addIssue({
        code: "custom",
        message: "DATABASE_URL should not be localhost in production",
        path: ["DATABASE_URL"],
      });
    }
  });

export type Config = {
  env: "development" | "production" | "test";
  port: number;
  host: string;
  databaseUrl: string;
};

const validateConfig = (
  rawEnv: Record<string, string | undefined> = process.env,
) => {
  const result = envSchema.safeParse(rawEnv);
  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `[config] Configuration validation failed:\n${errorDetails}`,
    );
  }

  const { HOST, PORT, NODE_ENV, DATABASE_URL } = result.data;

  return {
    env: NODE_ENV,
    port: PORT,
    host: HOST,
    databaseUrl: DATABASE_URL,
  };
};

export const config = validateConfig();
