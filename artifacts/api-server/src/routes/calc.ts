import { Router } from "express";
import { db, sportsTable, calcMultipliersTable } from "@workspace/db";
import { eq, avg } from "drizzle-orm";
import { ComputeCaloriesBody } from "@workspace/api-zod";

const router = Router();

router.post("/calc/compute", async (req, res) => {
  const parsed = ComputeCaloriesBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });

  const { sportId, durationMinutes, heartRateBpm, vo2Max, elevationGainMeters = 0, weightKg = 70 } = parsed.data;

  try {
    const sport = await db.select().from(sportsTable).where(eq(sportsTable.id, sportId)).limit(1);
    if (!sport.length) return res.status(404).json({ error: "Sport not found" });

    const multipliers = await db.select().from(calcMultipliersTable);
    const mByKey = Object.fromEntries(multipliers.map(m => [m.paramKey, m.value]));

    const durationHours = durationMinutes / 60;
    const baseMet = sport[0].baseMet;

    // Heart rate factor: zone based on % of estimated max HR (220 - 35 assumed age)
    const maxHr = 220 - 35;
    const hrPercent = heartRateBpm / maxHr;
    const hrMultiplier = mByKey["heart_rate"] ?? 1.0;
    const heartRateFactor = 1 + (hrPercent - 0.5) * hrMultiplier;

    // VO2 max factor: normalized to 40 ml/kg/min as baseline
    const vo2Multiplier = mByKey["vo2_max"] ?? 0.01;
    const vo2Factor = 1 + (vo2Max - 40) * vo2Multiplier;

    // Elevation bonus: extra METs per 100m of gain
    const elevationMultiplier = mByKey["elevation"] ?? 0.5;
    const elevationBonus = sport[0].appliesElevation ? (elevationGainMeters / 100) * elevationMultiplier : 0;

    // Duration multiplier
    const durationMult = mByKey["duration"] ?? 1.0;

    // Calories = MET × weight(kg) × duration(h) × factors
    const base = baseMet * weightKg * durationHours;
    const calories = base * heartRateFactor * Math.max(0.5, vo2Factor) * durationMult + elevationBonus * weightKg * durationHours;

    res.json({
      calories: Math.round(calories),
      breakdown: {
        base: Math.round(base),
        heartRateFactor: Math.round(heartRateFactor * 100) / 100,
        vo2Factor: Math.round(Math.max(0.5, vo2Factor) * 100) / 100,
        elevationBonus: Math.round(elevationBonus * 100) / 100,
        durationHours: Math.round(durationHours * 100) / 100,
      },
      sport: {
        id: sport[0].id,
        name: sport[0].name,
        slug: sport[0].slug,
        baseMet: sport[0].baseMet,
        icon: sport[0].icon,
        appliesElevation: sport[0].appliesElevation,
        createdAt: sport[0].createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to compute calories" });
  }
});

router.get("/calc/summary", async (_req, res) => {
  try {
    const sports = await db.select().from(sportsTable);
    const multipliers = await db.select().from(calcMultipliersTable);

    const avgMet = sports.length > 0
      ? sports.reduce((sum, s) => sum + s.baseMet, 0) / sports.length
      : 0;

    const topSport = sports.length > 0
      ? sports.reduce((top, s) => (s.baseMet > top.baseMet ? s : top), sports[0])
      : null;

    res.json({
      totalSports: sports.length,
      totalMultipliers: multipliers.length,
      avgMet: Math.round(avgMet * 10) / 10,
      topSportByMet: topSport ? {
        id: topSport.id,
        name: topSport.name,
        slug: topSport.slug,
        baseMet: topSport.baseMet,
        icon: topSport.icon,
        appliesElevation: topSport.appliesElevation,
        createdAt: topSport.createdAt,
      } : undefined,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

export default router;
