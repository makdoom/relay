import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { config } from '../config/index.js';
import { logger } from '../logger/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const formatDbError = (error: unknown) => {
  if (error instanceof Error && error.message) {
    const code = (error as { code?: string }).code;
    return code ? `${error.message} ${code}` : error.message;
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    return String((error as { code: string }).code);
  }
  return String(error) || 'Unknown database migration error';
};

const runMigrations = async (
  databaseUrl = config.databaseUrl,
  migrationsFolder = path.resolve(__dirname, '../../drizzle')
): Promise<void> => {
  logger.info('Starting database migrations', {
    migrationsFolder,
    targetUrl: databaseUrl.replace(/:[^:@]+@/, ':****@'),
  });

  // Dedicated single db conenction for migration
  const migrationClient = postgres(databaseUrl, {
    max: 1,
    ssl: config.env === 'production' ? 'require' : false,
  });

  try {
    // Enforce defensive zero-downtime lock timeouts per database engineering rules
    await migrationClient`SET lock_timeout = '3s'`;
    await migrationClient`SET statement_timeout = '30s'`;

    const db = drizzle(migrationClient);

    await migrate(db, { migrationsFolder });
    logger.info('Database migrations applied successfully');
  } catch (error) {
    const errorMessage = formatDbError(error);
    logger.error('Database migration failed', { error: errorMessage });
    throw error;
  } finally {
    await migrationClient.end();
  }
};

// CLI execution
const isDirectExecution =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isDirectExecution) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
