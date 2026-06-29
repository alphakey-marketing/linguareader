import { Router } from "express";
import { db, vocabTable } from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";
import {
  GetVocabQueryParams,
  LookupVocabBody,
  UpdateVocabEntryBody,
  UpsertVocabBody,
} from "@workspace/api-zod";

const router = Router();

router.get("/vocab", async (req, res) => {
  const parsed = GetVocabQueryParams.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: "Invalid query" });

  const { status, limit, offset } = parsed.data;

  let query = db.select().from(vocabTable);
  if (status !== null && status !== undefined) {
    query = query.where(eq(vocabTable.status, status)) as typeof query;
  }
  const entries = await query
    .limit(limit ?? 100)
    .offset(offset ?? 0)
    .orderBy(vocabTable.updatedAt);

  return res.json(entries.map(formatVocab));
});

router.get("/vocab/summary", async (_req, res) => {
  const entries = await db.select({ status: vocabTable.status }).from(vocabTable);
  const summary = { total: entries.length, known: 0, learning: 0, unknown: 0, ignored: 0 };
  for (const e of entries) {
    if (e.status === 5) summary.known++;
    else if (e.status === 99) summary.ignored++;
    else if (e.status === 0) summary.unknown++;
    else summary.learning++;
  }
  return res.json(summary);
});

router.post("/vocab/lookup", async (req, res) => {
  const parsed = LookupVocabBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const { dictionaryForms } = parsed.data;
  if (!dictionaryForms.length) return res.json({});

  const entries = await db
    .select()
    .from(vocabTable)
    .where(inArray(vocabTable.dictionaryForm, dictionaryForms));

  const result: Record<string, ReturnType<typeof formatVocab>> = {};
  for (const e of entries) {
    result[e.dictionaryForm] = formatVocab(e);
  }
  return res.json(result);
});

router.post("/vocab/upsert", async (req, res) => {
  const parsed = UpsertVocabBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const { surface, dictionaryForm, reading, status, sourceLessonId } = parsed.data;

  const existing = await db
    .select()
    .from(vocabTable)
    .where(eq(vocabTable.dictionaryForm, dictionaryForm))
    .limit(1);

  if (existing.length > 0) {
    const entry = existing[0];
    const [updated] = await db
      .update(vocabTable)
      .set({
        timesSeen: entry.timesSeen + 1,
        status: status !== null && status !== undefined ? status : entry.status,
        updatedAt: new Date(),
      })
      .where(eq(vocabTable.id, entry.id))
      .returning();
    return res.json(formatVocab(updated));
  } else {
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + 1);
    const [created] = await db
      .insert(vocabTable)
      .values({
        surface,
        dictionaryForm,
        reading,
        status: status !== null && status !== undefined ? status : 1,
        timesSeen: 1,
        sourceLessonId: sourceLessonId ?? null,
        nextReview,
        easeFactor: 2.5,
        intervalDays: 1,
      })
      .returning();
    return res.json(formatVocab(created));
  }
});

router.patch("/vocab/:id", async (req, res) => {
  const parsed = UpdateVocabEntryBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const { status, note } = parsed.data;
  if (status !== null && status !== undefined) updates.status = status;
  if (note !== null && note !== undefined) updates.note = note;

  const [entry] = await db
    .update(vocabTable)
    .set(updates)
    .where(eq(vocabTable.id, req.params.id))
    .returning();
  if (!entry) return res.status(404).json({ error: "Not found" });
  return res.json(formatVocab(entry));
});

function formatVocab(e: typeof vocabTable.$inferSelect) {
  return {
    id: e.id,
    surface: e.surface,
    dictionaryForm: e.dictionaryForm,
    reading: e.reading,
    status: e.status,
    timesSeen: e.timesSeen,
    note: e.note,
    sourceLessonId: e.sourceLessonId,
    nextReview: e.nextReview?.toISOString() ?? null,
    easeFactor: e.easeFactor,
    intervalDays: e.intervalDays,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export default router;
