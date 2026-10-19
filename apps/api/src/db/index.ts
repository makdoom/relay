import { drizzle, PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "../config/index.js";
import { logger } from "../logger/index.js";

export type DbClient = postgres.Sql;
export type Database = PostgresJsDatabase;

export const createDatabaseClient = (
  databaseUrl: string,
  options: {
    max?: number;
    idleTimeout?: number;
    connectTimeout?: number;
    ssl?: boolean | "require";
  } = {},
): { sql: DbClient; db: Database } => {
  const sql = postgres(databaseUrl, {
    max: options.max ?? (config.env === "test" ? 5 : 10),
    idle_timeout: options.idleTimeout ?? 20,
    connect_timeout: options.connectTimeout ?? 10,
    ssl: options.ssl ?? (config.env === "production" ? "require" : false),
    onnotice: () => {},
  });

  const db = drizzle(sql);

  return { sql, db };
};

// Default application database client singleton
export const { sql, db } = createDatabaseClient(config.databaseUrl);

export const checkDatabaseConnection = async (
  client: DbClient = sql,
  timeoutMs = 5000,
): Promise<{ ok: boolean; latencyMs?: number; error?: string }> => {
  const start = Date.now();

  try {
    await Promise.race([
      client`SELECT NOW()`,
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Database connection timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      }),
    ]);

    return {
      ok: true,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Database connection check failed", { error: errorMessage });

    return {
      ok: false,
      error: errorMessage,
    };
  }
};

export const closeDatabaseConnection = async (
  client: DbClient = sql,
  timeoutSeconds = 5,
): Promise<void> => {
  try {
    await client.end({ timeout: timeoutSeconds });
    logger.info("Database connection pool drained successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error closing database connection pool", {
      error: errorMessage,
    });
    throw error;
  }
};
