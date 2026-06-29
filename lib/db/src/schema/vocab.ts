import { pgTable, text, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vocabTable = pgTable("vocab", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  surface: text("surface").notNull(),
  dictionaryForm: text("dictionary_form").notNull().unique(),
  reading: text("reading").notNull(),
  status: integer("status").notNull().default(0),
  timesSeen: integer("times_seen").notNull().default(1),
  note: text("note"),
  sourceLessonId: text("source_lesson_id"),
  nextReview: timestamp("next_review"),
  easeFactor: real("ease_factor").notNull().default(2.5),
  intervalDays: integer("interval_days").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVocabSchema = createInsertSchema(vocabTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertVocab = z.infer<typeof insertVocabSchema>;
export type Vocab = typeof vocabTable.$inferSelect;
