import { defineConfig } from 'drizzle-kit';
import { config } from './src/config/index.js';

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: config.databaseUrl,
  },
  verbose: true,
  strict: true,
});
