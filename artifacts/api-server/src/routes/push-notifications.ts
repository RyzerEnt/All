import { Router } from "express";
import cron from "node-cron";
import { requireAuth } from "../middleware/auth";
import { pool } from "../lib/db";

const router = Router();

// ── Tables ────────────────────────────────────────────────────────────────────
pool.query(`
  CREATE TABLE IF NOT EXISTS push_tokens (
    clerk_user_id TEXT PRIMARY KEY,
    expo_push_token TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
`).catch((err) => console.error("[push] Table init error:", err));

// ── Helpers ───────────────────────────────────────────────────────────────────
async function getTodayExercise() {
  const days = Math.floor(Date.now() / 86400000);
  const dayNumber = (days % 30) + 1;
  const { rows } = await pool.query(
    `SELECT exercise, sets, reps, unit, tip FROM calisthenics_program WHERE day_number = $1`,
    [dayNumber]
  );
  return rows[0] ?? null;
}

export async function broadcastDailyNotification(): Promise<number> {
  const { rows: tokenRows } = await pool.query(`SELECT expo_push_token FROM push_tokens`);
  if (tokenRows.length === 0) return 0;

  const exercise = await getTodayExercise();
  if (!exercise) return 0;

  const repsStr =
    exercise.reps > 0
      ? `${exercise.sets}×${exercise.reps} ${exercise.unit}`
      : `${exercise.sets} circuits`;

  const messages = tokenRows.map((r: { expo_push_token: string }) => ({
    to: r.expo_push_token,
    title: "🏋️ Programme du jour",
    body: `${exercise.exercise} — ${repsStr}`,
    data: { screen: "calisthenics" },
    sound: "default",
  }));

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(messages),
  });

  console.log(`[push] Broadcast sent to ${messages.length} device(s) — ${exercise.exercise}`);
  return messages.length;
}

// ── Cron ──────────────────────────────────────────────────────────────────────
let cronJob: ReturnType<typeof cron.schedule> | null = null;

export function scheduleCron(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  if (isNaN(hour) || isNaN(minute)) return;
  if (cronJob) { cronJob.stop(); cronJob = null; }
  cronJob = cron.schedule(
    `${minute} ${hour} * * *`,
    async () => {
      console.log(`[push] Cron fired at ${time} (Europe/Paris)`);
      await broadcastDailyNotification();
    },
    { timezone: "Europe/Paris" }
  );
  console.log(`[push] Cron scheduled at ${time} (Europe/Paris)`);
}

// Bootstrap: load saved time from DB then start cron
pool
  .query(`SELECT value FROM app_settings WHERE key = 'notification_time'`)
  .then(({ rows }) => scheduleCron(rows[0]?.value ?? "08:00"))
  .catch(() => scheduleCron("08:00"));

// ── Routes ────────────────────────────────────────────────────────────────────

// POST /api/push-tokens — user saves their Expo push token
// Auth: any signed-in user (Clerk Bearer token forwarded by mobile app)
router.post("/push-tokens", async (req, res) => {
  const authHeader = req.headers.authorization ?? "";
  const clerkToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!clerkToken) return res.status(401).json({ error: "Non autorisé" });

  // Decode JWT payload (no verify – Clerk already validated on the client)
  let userId: string | null = null;
  try {
    const payload = JSON.parse(Buffer.from(clerkToken.split(".")[1], "base64url").toString());
    userId = payload.sub ?? null;
  } catch {
    return res.status(400).json({ error: "Token invalide" });
  }
  if (!userId) return res.status(400).json({ error: "sub manquant" });

  const { token } = req.body;
  if (!token || typeof token !== "string" || !token.startsWith("ExponentPushToken")) {
    return res.status(400).json({ error: "Token Expo invalide" });
  }

  try {
    await pool.query(
      `INSERT INTO push_tokens (clerk_user_id, expo_push_token, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (clerk_user_id) DO UPDATE SET expo_push_token = $2, updated_at = NOW()`,
      [userId, token]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/notification-settings — admin
router.get("/admin/notification-settings", requireAuth, async (_req, res) => {
  try {
    const [{ rows: settings }, { rows: counts }] = await Promise.all([
      pool.query(`SELECT value FROM app_settings WHERE key = 'notification_time'`),
      pool.query(`SELECT COUNT(*)::int AS cnt FROM push_tokens`),
    ]);
    res.json({
      notificationTime: settings[0]?.value ?? "08:00",
      tokenCount: counts[0].cnt,
    });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/admin/notification-settings — admin
router.put("/admin/notification-settings", requireAuth, async (req, res) => {
  const { notificationTime } = req.body;
  if (!notificationTime || !/^\d{2}:\d{2}$/.test(notificationTime)) {
    return res.status(400).json({ error: "Format invalide (HH:MM)" });
  }
  try {
    await pool.query(
      `INSERT INTO app_settings (key, value, updated_at) VALUES ('notification_time', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [notificationTime]
    );
    scheduleCron(notificationTime);
    res.json({ ok: true, notificationTime });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/admin/notifications/send — broadcast immediately
router.post("/admin/notifications/send", requireAuth, async (_req, res) => {
  try {
    const sent = await broadcastDailyNotification();
    res.json({ ok: true, sent });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
