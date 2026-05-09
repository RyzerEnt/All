import { Router } from "express";
import { getAuth } from "@clerk/express";
import { pool } from "../lib/db";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.clerkUserId = userId;
  next();
}

// GET /api/me — get or create user profile
router.get("/me", requireAuth, async (req: any, res) => {
  try {
    const { clerkUserId } = req;
    let result = await pool.query(
      "SELECT * FROM ryzer_users WHERE clerk_user_id = $1",
      [clerkUserId]
    );
    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO ryzer_users (clerk_user_id) VALUES ($1) RETURNING *`,
        [clerkUserId]
      );
    }
    const user = result.rows[0];
    res.json({
      clerkUserId: user.clerk_user_id,
      displayName: user.display_name,
      photoData: user.photo_data,
      totalPoints: user.total_points,
      isSetupComplete: user.is_setup_complete,
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/me — update profile
router.put("/me", requireAuth, async (req: any, res) => {
  try {
    const { clerkUserId } = req;
    const { displayName, isSetupComplete } = req.body;

    // Upsert user
    await pool.query(
      `INSERT INTO ryzer_users (clerk_user_id, display_name, is_setup_complete, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (clerk_user_id) DO UPDATE
       SET display_name = EXCLUDED.display_name,
           is_setup_complete = EXCLUDED.is_setup_complete,
           updated_at = NOW()`,
      [clerkUserId, displayName ?? "", isSetupComplete ?? false]
    );

    const result = await pool.query(
      "SELECT * FROM ryzer_users WHERE clerk_user_id = $1",
      [clerkUserId]
    );
    const user = result.rows[0];
    res.json({
      clerkUserId: user.clerk_user_id,
      displayName: user.display_name,
      photoData: user.photo_data,
      totalPoints: user.total_points,
      isSetupComplete: user.is_setup_complete,
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/me/photo — upload profile photo (base64)
router.post("/me/photo", requireAuth, async (req: any, res) => {
  try {
    const { clerkUserId } = req;
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "Missing imageBase64" });

    await pool.query(
      `INSERT INTO ryzer_users (clerk_user_id, photo_data, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (clerk_user_id) DO UPDATE
       SET photo_data = EXCLUDED.photo_data, updated_at = NOW()`,
      [clerkUserId, imageBase64]
    );
    res.json({ success: true });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/sessions — list user sessions
router.get("/sessions", requireAuth, async (req: any, res) => {
  try {
    const { clerkUserId } = req;
    const result = await pool.query(
      `SELECT id, sport_name, sport_icon, duration_seconds, points, created_at
       FROM ryzer_sessions WHERE clerk_user_id = $1
       ORDER BY created_at DESC LIMIT 20`,
      [clerkUserId]
    );
    res.json(result.rows.map((r) => ({
      id: r.id,
      sportName: r.sport_name,
      sportIcon: r.sport_icon,
      durationSeconds: r.duration_seconds,
      points: r.points,
      createdAt: r.created_at,
    })));
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/sessions — create a session
router.post("/sessions", requireAuth, async (req: any, res) => {
  try {
    const { clerkUserId } = req;
    const { sportName, sportIcon, durationSeconds, points } = req.body;
    if (!sportName || !durationSeconds || points === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Ensure user row exists
    await pool.query(
      `INSERT INTO ryzer_users (clerk_user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
      [clerkUserId]
    );

    // Insert session
    const sessionResult = await pool.query(
      `INSERT INTO ryzer_sessions (clerk_user_id, sport_name, sport_icon, duration_seconds, points)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [clerkUserId, sportName, sportIcon ?? "run", durationSeconds, points]
    );

    // Update total points
    await pool.query(
      `UPDATE ryzer_users SET total_points = total_points + $1, updated_at = NOW()
       WHERE clerk_user_id = $2`,
      [points, clerkUserId]
    );

    const s = sessionResult.rows[0];
    res.json({
      id: s.id,
      sportName: s.sport_name,
      sportIcon: s.sport_icon,
      durationSeconds: s.duration_seconds,
      points: s.points,
      createdAt: s.created_at,
    });
  } catch (err) {
    req.log?.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
