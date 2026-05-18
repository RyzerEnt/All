import { Router } from "express";
import { getAuth } from "@clerk/express";
import { pool } from "../lib/db";

const router = Router();

pool.query(`
  CREATE TABLE IF NOT EXISTS calisthenics_manual_checks (
    clerk_user_id TEXT NOT NULL,
    challenge_id   INT  NOT NULL,
    checked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (clerk_user_id, challenge_id)
  );
  CREATE TABLE IF NOT EXISTS daily_calisthenics_logs (
    clerk_user_id TEXT NOT NULL,
    log_date       DATE NOT NULL,
    completed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (clerk_user_id, log_date)
  );
`).catch((err) => console.error("calisthenics table init error:", err));

function requireClerk(req: any, res: any): string | null {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return null; }
  return auth.userId;
}

// GET /api/me/calisthenics — calisthenics challenges with manual check status
router.get("/me/calisthenics", async (req, res) => {
  const userId = requireClerk(req, res);
  if (!userId) return;
  try {
    const [challengesRes, checksRes] = await Promise.all([
      pool.query(`SELECT * FROM challenges WHERE is_calisthenics = true ORDER BY sort_order ASC, id ASC`),
      pool.query(
        `SELECT challenge_id FROM calisthenics_manual_checks WHERE clerk_user_id = $1`,
        [userId]
      ),
    ]);
    const checkedIds = new Set(checksRes.rows.map((r: any) => r.challenge_id));
    res.json(
      challengesRes.rows.map((c: any) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        icon: c.icon,
        xpReward: c.xp_reward,
        accent: c.accent,
        checked: checkedIds.has(c.id),
      }))
    );
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/me/calisthenics/:id/toggle — toggle manual check
router.post("/me/calisthenics/:id/toggle", async (req, res) => {
  const userId = requireClerk(req, res);
  if (!userId) return;
  const challengeId = Number(req.params.id);
  try {
    const { rows } = await pool.query(
      `SELECT 1 FROM calisthenics_manual_checks WHERE clerk_user_id = $1 AND challenge_id = $2`,
      [userId, challengeId]
    );
    if (rows.length > 0) {
      await pool.query(
        `DELETE FROM calisthenics_manual_checks WHERE clerk_user_id = $1 AND challenge_id = $2`,
        [userId, challengeId]
      );
      res.json({ checked: false });
    } else {
      await pool.query(
        `INSERT INTO calisthenics_manual_checks (clerk_user_id, challenge_id) VALUES ($1, $2)`,
        [userId, challengeId]
      );
      res.json({ checked: true });
    }
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/me/daily-program?year=YYYY&month=MM
router.get("/me/daily-program", async (req, res) => {
  const userId = requireClerk(req, res);
  if (!userId) return;
  const year = parseInt(String(req.query.year)) || new Date().getFullYear();
  const month = parseInt(String(req.query.month)) || new Date().getMonth() + 1;
  try {
    const { rows } = await pool.query(
      `SELECT log_date::text FROM daily_calisthenics_logs
       WHERE clerk_user_id = $1
         AND EXTRACT(YEAR  FROM log_date) = $2
         AND EXTRACT(MONTH FROM log_date) = $3`,
      [userId, year, month]
    );
    const completed = rows.map((r: any) => r.log_date.slice(0, 10));
    res.json({ completed });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/me/daily-program/toggle  { date: "YYYY-MM-DD" }
router.post("/me/daily-program/toggle", async (req, res) => {
  const userId = requireClerk(req, res);
  if (!userId) return;
  const { date } = req.body as { date?: string };
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: "date invalide (YYYY-MM-DD)" });
    return;
  }
  try {
    const { rows } = await pool.query(
      `SELECT 1 FROM daily_calisthenics_logs WHERE clerk_user_id = $1 AND log_date = $2`,
      [userId, date]
    );
    if (rows.length > 0) {
      await pool.query(
        `DELETE FROM daily_calisthenics_logs WHERE clerk_user_id = $1 AND log_date = $2`,
        [userId, date]
      );
      res.json({ completed: false });
    } else {
      await pool.query(
        `INSERT INTO daily_calisthenics_logs (clerk_user_id, log_date) VALUES ($1, $2)`,
        [userId, date]
      );
      res.json({ completed: true });
    }
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
