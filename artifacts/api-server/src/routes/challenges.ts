import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { pool } from "../lib/db";
import { getAuth } from "@clerk/express";

const router = Router();

function formatChallenge(r: any) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    icon: r.icon,
    metricType: r.metric_type,
    targetValue: r.target_value,
    targetUnit: r.target_unit,
    xpReward: r.xp_reward,
    accent: r.accent,
    isCalisthenics: r.is_calisthenics,
    sortOrder: r.sort_order,
    createdAt: r.created_at,
  };
}

// GET /api/challenges — public list
router.get("/challenges", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM challenges ORDER BY sort_order ASC, id ASC`
    );
    res.json(rows.map(formatChallenge));
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/me/challenges — authenticated: challenges with user progress
router.get("/me/challenges", async (req, res) => {
  try {
    const auth = getAuth(req);
    const clerkUserId = auth?.userId;
    if (!clerkUserId) return res.status(401).json({ error: "Unauthorized" });

    const [challengesRes, userRes, sessionsRes, sportsRes, distanceRes, manualChecksRes] = await Promise.all([
      pool.query(`SELECT * FROM challenges ORDER BY sort_order ASC, id ASC`),
      pool.query(`SELECT total_points FROM ryzer_users WHERE clerk_user_id = $1`, [clerkUserId]),
      pool.query(`SELECT COUNT(*)::int AS total FROM ryzer_sessions WHERE clerk_user_id = $1`, [clerkUserId]),
      pool.query(`SELECT COUNT(DISTINCT sport_name)::int AS total FROM ryzer_sessions WHERE clerk_user_id = $1`, [clerkUserId]),
      pool.query(`SELECT COALESCE(SUM(COALESCE(distance_m, 0)), 0) AS total FROM ryzer_sessions WHERE clerk_user_id = $1`, [clerkUserId]),
      pool.query(`SELECT challenge_id FROM calisthenics_manual_checks WHERE clerk_user_id = $1`, [clerkUserId]),
    ]);

    const totalPoints = userRes.rows[0]?.total_points ?? 0;
    const totalSessions = sessionsRes.rows[0]?.total ?? 0;
    const distinctSports = sportsRes.rows[0]?.total ?? 0;
    const totalDistanceKm = (distanceRes.rows[0]?.total ?? 0) / 1000;

    // Compute streak
    const { rows: streakRows } = await pool.query<{ d: string }>(
      `SELECT DISTINCT DATE(created_at AT TIME ZONE 'UTC') AS d
       FROM ryzer_sessions WHERE clerk_user_id = $1 ORDER BY d DESC`,
      [clerkUserId]
    );
    let streak = 0;
    if (streakRows.length > 0) {
      const todayUTC = new Date();
      todayUTC.setUTCHours(0, 0, 0, 0);
      const yesterdayUTC = new Date(todayUTC);
      yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);
      const mostRecent = new Date(streakRows[0].d);
      mostRecent.setUTCHours(0, 0, 0, 0);
      if (mostRecent >= yesterdayUTC) {
        streak = 1;
        let current = mostRecent;
        for (let i = 1; i < streakRows.length; i++) {
          const prev = new Date(streakRows[i].d);
          prev.setUTCHours(0, 0, 0, 0);
          const expected = new Date(current);
          expected.setUTCDate(expected.getUTCDate() - 1);
          if (prev.getTime() === expected.getTime()) { streak++; current = prev; }
          else break;
        }
      }
    }

    // Manual checks for calisthenics challenges
    const manualChecksSet = new Set<number>(manualChecksRes.rows.map((r: any) => r.challenge_id));

    // Fetch completed challenges for this user
    const { rows: completedRows } = await pool.query(
      `SELECT challenge_id, completed_at FROM user_challenge_progress WHERE clerk_user_id = $1`,
      [clerkUserId]
    );
    const completedMap = new Map(completedRows.map((r) => [r.challenge_id, r.completed_at]));

    const challenges = challengesRes.rows.map((c) => {
      // Calisthenics challenges are ONLY marked done via manual checks — never auto-computed
      if (c.is_calisthenics) {
        const done = manualChecksSet.has(c.id);
        return {
          ...formatChallenge(c),
          progress: done ? 1 : 0,
          done,
          completedAt: completedMap.get(c.id) ?? null,
        };
      }

      let progress = 0;
      switch (c.metric_type) {
        case "distance": progress = Math.min(totalDistanceKm, c.target_value); break;
        case "streak": progress = Math.min(streak, c.target_value); break;
        case "sessions": progress = Math.min(totalSessions, c.target_value); break;
        case "sports": progress = Math.min(distinctSports, c.target_value); break;
        case "points": progress = Math.min(totalPoints, c.target_value); break;
      }
      const done = progress >= c.target_value;
      return {
        ...formatChallenge(c),
        progress: Math.round(progress * 100) / 100,
        done,
        completedAt: completedMap.get(c.id) ?? null,
      };
    });

    // Auto-mark newly completed challenges (non-calisthenics only)
    const newlyDone = challenges.filter((c) => c.done && !c.isCalisthenics && !completedMap.has(c.id));
    if (newlyDone.length > 0) {
      await Promise.all(
        newlyDone.map((c) =>
          pool.query(
            `INSERT INTO user_challenge_progress (clerk_user_id, challenge_id, completed_at)
             VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING`,
            [clerkUserId, c.id]
          )
        )
      );
    }

    res.json(challenges);
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/challenges — admin
router.post("/challenges", requireAuth, async (req, res) => {
  try {
    const { title, description, category, icon, metricType, targetValue, targetUnit, xpReward, accent, isCalisthenics, sortOrder } = req.body;
    if (!title) return res.status(400).json({ error: "Titre requis" });
    const { rows } = await pool.query(
      `INSERT INTO challenges (title, description, category, icon, metric_type, target_value, target_unit, xp_reward, accent, is_calisthenics, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [title, description ?? "", category ?? "POINTS", icon ?? "trophy", metricType ?? "points",
       targetValue ?? 100, targetUnit ?? "pts", xpReward ?? 50, accent ?? "blue",
       isCalisthenics ?? false, sortOrder ?? 0]
    );
    res.status(201).json(formatChallenge(rows[0]));
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/challenges/:id — admin
router.put("/challenges/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { title, description, category, icon, metricType, targetValue, targetUnit, xpReward, accent, isCalisthenics, sortOrder } = req.body;
    const { rows } = await pool.query(
      `UPDATE challenges SET title=$1, description=$2, category=$3, icon=$4, metric_type=$5,
       target_value=$6, target_unit=$7, xp_reward=$8, accent=$9, is_calisthenics=$10,
       sort_order=$11, updated_at=NOW() WHERE id=$12 RETURNING *`,
      [title, description ?? "", category ?? "POINTS", icon ?? "trophy", metricType ?? "points",
       targetValue ?? 100, targetUnit ?? "pts", xpReward ?? 50, accent ?? "blue",
       isCalisthenics ?? false, sortOrder ?? 0, id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Introuvable" });
    res.json(formatChallenge(rows[0]));
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/challenges/:id — admin
router.delete("/challenges/:id", requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await pool.query(`DELETE FROM challenges WHERE id=$1`, [id]);
    res.status(204).end();
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
