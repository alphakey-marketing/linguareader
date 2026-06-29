import { Router } from "express";
import { db } from "@workspace/db";
import { lessonsTable } from "@workspace/db";
import { eq, like, and, isNotNull } from "drizzle-orm";
import {
  GetLessonsQueryParams,
  CreateLessonBody,
  UpdateLessonBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/lessons", async (req, res) => {
  const parsed = GetLessonsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query params" });
  }
  const { collectionId, status, search } = parsed.data;

  const conditions = [];
  if (collectionId) conditions.push(eq(lessonsTable.collectionId, collectionId));
  if (status) conditions.push(eq(lessonsTable.status, status as "saved" | "in_progress" | "completed"));
  if (search) conditions.push(like(lessonsTable.title, `%${search}%`));

  const lessons = await db
    .select()
    .from(lessonsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(lessonsTable.createdAt);

  return res.json(lessons.map(formatLesson));
});

router.post("/lessons", async (req, res) => {
  const parsed = CreateLessonBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body" });
  }
  const { wordCount, ...rest } = parsed.data;
  const [lesson] = await db
    .insert(lessonsTable)
    .values({
      ...rest,
      wordCount: wordCount ?? 0,
    })
    .returning();
  return res.status(201).json(formatLesson(lesson));
});

router.get("/lessons/:id", async (req, res) => {
  const [lesson] = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.id, req.params.id));
  if (!lesson) return res.status(404).json({ error: "Not found" });
  return res.json(formatLesson(lesson));
});

router.patch("/lessons/:id", async (req, res) => {
  const parsed = UpdateLessonBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid body" });
  }
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const { title, status, collectionId } = parsed.data;
  if (title !== undefined && title !== null) updates.title = title;
  if (status !== undefined && status !== null) updates.status = status;
  if (collectionId !== undefined) updates.collectionId = collectionId;

  const [lesson] = await db
    .update(lessonsTable)
    .set(updates)
    .where(eq(lessonsTable.id, req.params.id))
    .returning();
  if (!lesson) return res.status(404).json({ error: "Not found" });
  return res.json(formatLesson(lesson));
});

router.delete("/lessons/:id", async (req, res) => {
  await db.delete(lessonsTable).where(eq(lessonsTable.id, req.params.id));
  return res.status(204).send();
});

router.get("/lessons/:id/stats", async (req, res) => {
  const { vocabTable } = await import("@workspace/db");
  const { count, eq: eqFn } = await import("drizzle-orm");

  const [lesson] = await db
    .select()
    .from(lessonsTable)
    .where(eq(lessonsTable.id, req.params.id));
  if (!lesson) return res.status(404).json({ error: "Not found" });

  const allVocab = await db.select().from(vocabTable);
  const vocabMap = new Map(allVocab.map((v) => [v.dictionaryForm, v]));

  let knownCount = 0;
  let learningCount = 0;
  let unknownCount = 0;
  let totalTokens = lesson.wordCount;

  if (lesson.tokens) {
    try {
      const tokens: Array<{ dictionaryForm?: string }> = JSON.parse(lesson.tokens);
      totalTokens = tokens.length;
      for (const token of tokens) {
        if (!token.dictionaryForm) { unknownCount++; continue; }
        const entry = vocabMap.get(token.dictionaryForm);
        if (!entry || entry.status === 0) unknownCount++;
        else if (entry.status === 5 || entry.status === 99) knownCount++;
        else learningCount++;
      }
    } catch {
      // fallback
    }
  }

  const percentKnown = totalTokens > 0 ? Math.round((knownCount / totalTokens) * 100) : 0;

  return res.json({
    lessonId: req.params.id,
    totalTokens,
    knownCount,
    learningCount,
    unknownCount,
    percentKnown,
  });
});

function formatLesson(lesson: typeof lessonsTable.$inferSelect) {
  return {
    id: lesson.id,
    title: lesson.title,
    sourceUrl: lesson.sourceUrl,
    sourceType: lesson.sourceType,
    rawText: lesson.rawText,
    tokens: lesson.tokens,
    audioUrl: lesson.audioUrl,
    collectionId: lesson.collectionId,
    status: lesson.status,
    wordCount: lesson.wordCount,
    createdAt: lesson.createdAt.toISOString(),
  };
}

export default router;
