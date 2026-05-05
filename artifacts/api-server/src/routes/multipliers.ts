import { Router } from "express";
import { db, calcMultipliersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateMultiplierBody, UpdateMultiplierParams } from "@workspace/api-zod";

const router = Router();

router.get("/multipliers", async (_req, res) => {
  try {
    const multipliers = await db.select().from(calcMultipliersTable).orderBy(calcMultipliersTable.paramKey);
    res.json(multipliers.map(m => ({
      id: m.id,
      paramKey: m.paramKey,
      label: m.label,
      value: m.value,
      description: m.description,
      minValue: m.minValue,
      maxValue: m.maxValue,
      unit: m.unit,
      updatedAt: m.updatedAt,
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch multipliers" });
  }
});

router.put("/multipliers/:id", async (req, res) => {
  const params = UpdateMultiplierParams.safeParse(req.params);
  if (!params.success) return res.status(400).json({ error: "Invalid ID" });
  const parsed = UpdateMultiplierBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  try {
    const [multiplier] = await db
      .update(calcMultipliersTable)
      .set({ value: parsed.data.value, updatedAt: new Date() })
      .where(eq(calcMultipliersTable.id, params.data.id))
      .returning();
    if (!multiplier) return res.status(404).json({ error: "Multiplier not found" });
    res.json({
      id: multiplier.id,
      paramKey: multiplier.paramKey,
      label: multiplier.label,
      value: multiplier.value,
      description: multiplier.description,
      minValue: multiplier.minValue,
      maxValue: multiplier.maxValue,
      unit: multiplier.unit,
      updatedAt: multiplier.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update multiplier" });
  }
});

export default router;
