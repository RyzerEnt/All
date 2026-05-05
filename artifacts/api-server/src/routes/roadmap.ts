import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, roadmapItems, insertRoadmapSchema, updateRoadmapSchema } from "@workspace/db";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/roadmap", async (req, res) => {
  try {
    const items = await db
      .select()
      .from(roadmapItems)
      .orderBy(roadmapItems.sortOrder, roadmapItems.createdAt);
    res.json(items);
  } catch (err) {
    req.log.error(err, "Failed to fetch roadmap");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.post("/roadmap", requireAuth, async (req, res) => {
  const parsed = insertRoadmapSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const [item] = await db.insert(roadmapItems).values(parsed.data).returning();
    res.status(201).json(item);
  } catch (err) {
    req.log.error(err, "Failed to create roadmap item");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.put("/roadmap/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const parsed = updateRoadmapSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    const [item] = await db
      .update(roadmapItems)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(roadmapItems.id, id))
      .returning();
    if (!item) { res.status(404).json({ error: "Introuvable" }); return; }
    res.json(item);
  } catch (err) {
    req.log.error(err, "Failed to update roadmap item");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

router.delete("/roadmap/:id", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  try {
    await db.delete(roadmapItems).where(eq(roadmapItems.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error(err, "Failed to delete roadmap item");
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
