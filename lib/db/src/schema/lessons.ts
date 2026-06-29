import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sourceTypeEnum = pgEnum("source_type", ["text", "youtube", "audio", "epub", "url"]);
export const lessonStatusEnum = pgEnum("lesson_status", ["saved", "in_progress", "completed"]);

export const lessonsTable = pgTable("lessons", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  sourceUrl: text("source_url"),
  sourceType: sourceTypeEnum("source_type").notNull().default("text"),
  rawText: text("raw_text").notNull(),
  tokens: text("tokens"),
  audioUrl: text("audio_url"),
  collectionId: text("collection_id"),
  status: lessonStatusEnum("status").notNull().default("saved"),
  wordCount: integer("word_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertLessonSchema = createInsertSchema(lessonsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Lesson = typeof lessonsTable.$inferSelect;
