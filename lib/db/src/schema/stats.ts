import { pgTable, text, timestamp, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const statsTable = pgTable("stats_daily", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  date: date("date").notNull(),
  wordsRead: integer("words_read").notNull().default(0),
  listeningMinutes: integer("listening_minutes").notNull().default(0),
  newLingqs: integer("new_lingqs").notNull().default(0),
  knownWordsTotal: integer("known_words_total").notNull().default(0),
  studyMinutes: integer("study_minutes").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStatsSchema = createInsertSchema(statsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertStats = z.infer<typeof insertStatsSchema>;
export type Stats = typeof statsTable.$inferSelect;
