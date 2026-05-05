import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, featuresTable, insertFeatureSchema, updateFeatureSchema } from "@workspace/db";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/features", async (req, res) => {
  try {
    const items = await db
      .select()
      .from(featuresTable)
      .orderBy(featuresTable.sortOrder, featuresTable.createdAt);
    res.json(items);
  } catch (err) {
    req.log.error(err, "Failed to fetch features");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/features", requireAuth, async (req, res) => {
  const parsed = insertFeatureSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const [item] = await db.insert(featuresTable).values(parsed.data).returning();
    res.status(201).json(item);
  } catch (err) {
    req.log.error(err, "Failed to create feature");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/features/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = updateFeatureSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const [item] = await db
      .update(featuresTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(featuresTable.id, id))
      .returning();
    if (!item) { res.status(404).json({ error: "Introuvable" }); return; }
    res.json(item);
  } catch (err) {
    req.log.error(err, "Failed to update feature");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.delete("/features/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  try {
    await db.delete(featuresTable).where(eq(featuresTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error(err, "Failed to delete feature");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
