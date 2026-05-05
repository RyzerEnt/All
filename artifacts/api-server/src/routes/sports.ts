import { Router } from "express";
import { db, sportsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateSportBody,
  UpdateSportBody,
  UpdateSportParams,
  DeleteSportParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/sports", async (_req, res) => {
  try {
    const sports = await db.select().from(sportsTable).orderBy(sportsTable.name);
    res.json(sports.map(s => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      baseMet: s.baseMet,
      icon: s.icon,
      appliesElevation: s.appliesElevation,
      createdAt: s.createdAt,
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sports" });
  }
});

router.post("/sports", async (req, res) => {
  const parsed = CreateSportBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  try {
    const [sport] = await db.insert(sportsTable).values({
      name: parsed.data.name,
      slug: parsed.data.slug,
      baseMet: parsed.data.baseMet,
      icon: parsed.data.icon,
      appliesElevation: parsed.data.appliesElevation,
    }).returning();
    res.status(201).json({
      id: sport.id,
      name: sport.name,
      slug: sport.slug,
      baseMet: sport.baseMet,
      icon: sport.icon,
      appliesElevation: sport.appliesElevation,
      createdAt: sport.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create sport" });
  }
});

router.put("/sports/:id", async (req, res) => {
  const params = UpdateSportParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid ID" });
  const parsed = UpdateSportBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  try {
    const [sport] = await db
      .update(sportsTable)
      .set({
        name: parsed.data.name,
        slug: parsed.data.slug,
        baseMet: parsed.data.baseMet,
        icon: parsed.data.icon,
        appliesElevation: parsed.data.appliesElevation,
      })
      .where(eq(sportsTable.id, params.data.id))
      .returning();
    if (!sport) return res.status(404).json({ error: "Sport not found" });
    res.json({
      id: sport.id,
      name: sport.name,
      slug: sport.slug,
      baseMet: sport.baseMet,
      icon: sport.icon,
      appliesElevation: sport.appliesElevation,
      createdAt: sport.createdAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update sport" });
  }
});

router.delete("/sports/:id", async (req, res) => {
  const params = DeleteSportParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid ID" });
  try {
    await db.delete(sportsTable).where(eq(sportsTable.id, params.data.id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete sport" });
  }
});

export default router;
