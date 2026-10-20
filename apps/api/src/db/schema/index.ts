import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const systemSettings = pgTable('system_settings', {
  key: varchar('key', { length: 128 }).primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SystemSettings = typeof systemSettings.$inferSelect;
export type NewSystemSettings = typeof systemSettings.$inferInsert;
