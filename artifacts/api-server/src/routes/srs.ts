import { Router } from "express";
import { db, vocabTable, lessonsTable } from "@workspace/db";
import { lte, eq, and, ne } from "drizzle-orm";
import { SubmitSrsReviewBody } from "@workspace/api-zod";

const router = Router();

router.get("/srs/queue", async (_req, res) => {
  const now = new Date();

  const dueEntries = await db
    .select()
    .from(vocabTable)
    .where(
      and(
        lte(vocabTable.nextReview, now),
        ne(vocabTable.status, 5),
        ne(vocabTable.status, 99),
        ne(vocabTable.status, 0),
      )
    )
    .limit(50);

  const cards = await Promise.all(
    dueEntries.map(async (entry) => {
      let contextSentence = entry.surface;
      let lessonTitle: string | null = null;

      if (entry.sourceLessonId) {
        const [lesson] = await db
          .select()
          .from(lessonsTable)
          .where(eq(lessonsTable.id, entry.sourceLessonId));
        if (lesson) {
          lessonTitle = lesson.title;
          // Extract a sentence containing the word from raw text
          const sentences = lesson.rawText.split(/[。！？\n]/);
          const sentenceWithWord = sentences.find((s) =>
            s.includes(entry.surface) || s.includes(entry.dictionaryForm)
          );
          if (sentenceWithWord) {
            contextSentence = sentenceWithWord.trim();
          }
        }
      }

      return {
        vocabEntry: formatVocab(entry),
        contextSentence,
        lessonTitle,
      };
    })
  );

  return res.json(cards);
});

router.post("/srs/review", async (req, res) => {
  const parsed = SubmitSrsReviewBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const { vocabId, quality } = parsed.data;

  const [entry] = await db.select().from(vocabTable).where(eq(vocabTable.id, vocabId));
  if (!entry) return res.status(404).json({ error: "Not found" });

  // SM-2 algorithm
  let { easeFactor, intervalDays } = entry;
  easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  if (quality < 3) {
    intervalDays = 1;
  } else if (intervalDays === 1) {
    intervalDays = 6;
  } else {
    intervalDays = Math.round(intervalDays * easeFactor);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + intervalDays);

  // Update status based on quality
  let newStatus = entry.status;
  if (quality >= 4 && entry.status < 5) newStatus = Math.min(5, entry.status + 1);
  if (quality < 2 && entry.status > 1) newStatus = Math.max(1, entry.status - 1);

  const [updated] = await db
    .update(vocabTable)
    .set({
      easeFactor,
      intervalDays,
      nextReview,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(vocabTable.id, vocabId))
    .returning();

  return res.json(formatVocab(updated));
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
