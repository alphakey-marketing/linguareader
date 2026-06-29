import { Router } from "express";
import { db, collectionsTable, lessonsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { CreateCollectionBody, UpdateCollectionBody } from "@workspace/api-zod";

const router = Router();

router.get("/collections", async (_req, res) => {
  const collections = await db.select().from(collectionsTable).orderBy(collectionsTable.createdAt);

  const withCounts = await Promise.all(
    collections.map(async (c) => {
      const [{ value }] = await db
        .select({ value: count() })
        .from(lessonsTable)
        .where(eq(lessonsTable.collectionId, c.id));
      return {
        id: c.id,
        name: c.name,
        description: c.description,
        lessonCount: Number(value),
        createdAt: c.createdAt.toISOString(),
      };
    })
  );

  return res.json(withCounts);
});

router.post("/collections", async (req, res) => {
  const parsed = CreateCollectionBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const [collection] = await db.insert(collectionsTable).values(parsed.data).returning();

  return res.status(201).json({
    id: collection.id,
    name: collection.name,
    description: collection.description,
    lessonCount: 0,
    createdAt: collection.createdAt.toISOString(),
  });
});

router.patch("/collections/:id", async (req, res) => {
  const parsed = UpdateCollectionBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  const { name, description } = parsed.data;
  if (name !== null && name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;

  const [collection] = await db
    .update(collectionsTable)
    .set(updates)
    .where(eq(collectionsTable.id, req.params.id))
    .returning();
  if (!collection) return res.status(404).json({ error: "Not found" });

  const [{ value }] = await db
    .select({ value: count() })
    .from(lessonsTable)
    .where(eq(lessonsTable.collectionId, collection.id));

  return res.json({
    id: collection.id,
    name: collection.name,
    description: collection.description,
    lessonCount: Number(value),
    createdAt: collection.createdAt.toISOString(),
  });
});

router.delete("/collections/:id", async (req, res) => {
  await db.delete(collectionsTable).where(eq(collectionsTable.id, req.params.id));
  return res.status(204).send();
});

export default router;
