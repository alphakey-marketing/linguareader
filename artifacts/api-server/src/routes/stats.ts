import { Router } from "express";
import { db, statsTable, lessonsTable, vocabTable } from "@workspace/db";
import { eq, lte, ne, and, count, desc } from "drizzle-orm";
import { RecordStatsBody } from "@workspace/api-zod";

const router = Router();

router.get("/stats/dashboard", async (_req, res) => {
  const [knownCountResult] = await db
    .select({ value: count() })
    .from(vocabTable)
    .where(eq(vocabTable.status, 5));

  const [totalLessonsResult] = await db.select({ value: count() }).from(lessonsTable);

  const [inProgressResult] = await db
    .select({ value: count() })
    .from(lessonsTable)
    .where(eq(lessonsTable.status, "in_progress"));

  const [completedResult] = await db
    .select({ value: count() })
    .from(lessonsTable)
    .where(eq(lessonsTable.status, "completed"));

  const now = new Date();
  const [dueReviewResult] = await db
    .select({ value: count() })
    .from(vocabTable)
    .where(
      and(
        lte(vocabTable.nextReview, now),
        ne(vocabTable.status, 5),
        ne(vocabTable.status, 99),
        ne(vocabTable.status, 0),
      )
    );

  const allStats = await db.select().from(statsTable);
  const totalWordsRead = allStats.reduce((sum, s) => sum + s.wordsRead, 0);
  const totalListeningMinutes = allStats.reduce((sum, s) => sum + s.listeningMinutes, 0);
  const totalStudyMinutes = allStats.reduce((sum, s) => sum + s.studyMinutes, 0);

  return res.json({
    totalKnownWords: Number(knownCountResult.value),
    totalWordsRead,
    totalListeningMinutes,
    totalStudyMinutes,
    totalLessons: Number(totalLessonsResult.value),
    lessonsInProgress: Number(inProgressResult.value),
    lessonsCompleted: Number(completedResult.value),
    dueForReview: Number(dueReviewResult.value),
  });
});

router.get("/stats/history", async (req, res) => {
  const days = req.query.days ? parseInt(String(req.query.days)) : 30;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const stats = await db
    .select()
    .from(statsTable)
    .orderBy(statsTable.date)
    .limit(days);

  return res.json(
    stats.map((s) => ({
      date: s.date,
      wordsRead: s.wordsRead,
      listeningMinutes: s.listeningMinutes,
      newLingqs: s.newLingqs,
      knownWordsTotal: s.knownWordsTotal,
      studyMinutes: s.studyMinutes,
    }))
  );
});

router.post("/stats/record", async (req, res) => {
  const parsed = RecordStatsBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const today = new Date().toISOString().split("T")[0];
  const { wordsRead, listeningMinutes, newLingqs, studyMinutes } = parsed.data;

  const [existing] = await db
    .select()
    .from(statsTable)
    .where(eq(statsTable.date, today));

  const [knownCount] = await db
    .select({ value: count() })
    .from(vocabTable)
    .where(eq(vocabTable.status, 5));

  if (existing) {
    const [updated] = await db
      .update(statsTable)
      .set({
        wordsRead: existing.wordsRead + (wordsRead ?? 0),
        listeningMinutes: existing.listeningMinutes + (listeningMinutes ?? 0),
        newLingqs: existing.newLingqs + (newLingqs ?? 0),
        studyMinutes: existing.studyMinutes + (studyMinutes ?? 0),
        knownWordsTotal: Number(knownCount.value),
        updatedAt: new Date(),
      })
      .where(eq(statsTable.id, existing.id))
      .returning();
    return res.json({
      date: updated.date,
      wordsRead: updated.wordsRead,
      listeningMinutes: updated.listeningMinutes,
      newLingqs: updated.newLingqs,
      knownWordsTotal: updated.knownWordsTotal,
      studyMinutes: updated.studyMinutes,
    });
  } else {
    const [created] = await db
      .insert(statsTable)
      .values({
        date: today,
        wordsRead: wordsRead ?? 0,
        listeningMinutes: listeningMinutes ?? 0,
        newLingqs: newLingqs ?? 0,
        studyMinutes: studyMinutes ?? 0,
        knownWordsTotal: Number(knownCount.value),
      })
      .returning();
    return res.json({
      date: created.date,
      wordsRead: created.wordsRead,
      listeningMinutes: created.listeningMinutes,
      newLingqs: created.newLingqs,
      knownWordsTotal: created.knownWordsTotal,
      studyMinutes: created.studyMinutes,
    });
  }
});

export default router;
