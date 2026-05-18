import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { pool } from "../lib/db";

const router = Router();

const DEFAULT_PROGRAM = [
  { day: 1,  exercise: "Push-ups",          icon: "arm-flex",        sets: 3, reps: 10, unit: "reps", tip: "Coudes à 45°, descends jusqu'à la poitrine",         color: "#2563eb" },
  { day: 2,  exercise: "Squats",             icon: "human",           sets: 3, reps: 15, unit: "reps", tip: "Genoux dans l'axe, descends jusqu'à 90°",             color: "#22c55e" },
  { day: 3,  exercise: "Planche",            icon: "human-handsdown", sets: 3, reps: 20, unit: "sec",  tip: "Corps aligné, abdos serrés, respire lentement",       color: "#f97316" },
  { day: 4,  exercise: "Dips",               icon: "seat",            sets: 3, reps: 8,  unit: "reps", tip: "Coudes vers l'arrière, amplitude complète",            color: "#2563eb" },
  { day: 5,  exercise: "Fentes",             icon: "walk",            sets: 3, reps: 10, unit: "reps", tip: "Genou avant à 90°, genou arrière près du sol",         color: "#22c55e" },
  { day: 6,  exercise: "Mountain Climbers",  icon: "run-fast",        sets: 3, reps: 15, unit: "reps", tip: "Hanche basse, ramène les genoux rapidement",           color: "#f97316" },
  { day: 7,  exercise: "Récupération",       icon: "meditation",      sets: 1, reps: 10, unit: "min",  tip: "Étirements doux, respiration profonde — repos actif",  color: "#22c55e" },
  { day: 8,  exercise: "Push-ups",           icon: "arm-flex",        sets: 3, reps: 12, unit: "reps", tip: "Engage bien les triceps à la montée",                  color: "#2563eb" },
  { day: 9,  exercise: "Squats sautés",      icon: "run",             sets: 3, reps: 12, unit: "reps", tip: "Explose vers le haut à chaque répétition",             color: "#22c55e" },
  { day: 10, exercise: "Planche",            icon: "human-handsdown", sets: 3, reps: 30, unit: "sec",  tip: "Essaie la variante sur avant-bras",                    color: "#f97316" },
  { day: 11, exercise: "Dips",               icon: "seat",            sets: 3, reps: 10, unit: "reps", tip: "Descente contrôlée en 2 secondes",                     color: "#2563eb" },
  { day: 12, exercise: "Fentes alternées",   icon: "walk",            sets: 3, reps: 12, unit: "reps", tip: "Alterne gauche/droite sans pause entre les deux",      color: "#22c55e" },
  { day: 13, exercise: "Burpees",            icon: "run-fast",        sets: 3, reps: 8,  unit: "reps", tip: "Push-up + saut : exercice full body",                  color: "#f97316" },
  { day: 14, exercise: "Récupération",       icon: "meditation",      sets: 1, reps: 10, unit: "min",  tip: "Foam rolling si disponible, hydrate-toi",              color: "#22c55e" },
  { day: 15, exercise: "Pike Push-ups",      icon: "arm-flex",        sets: 4, reps: 10, unit: "reps", tip: "Hanches hautes, tête vers le sol — épaules++",         color: "#2563eb" },
  { day: 16, exercise: "Squat bulgare",      icon: "human",           sets: 3, reps: 10, unit: "reps", tip: "Pied arrière surélevé, 10 reps par jambe",             color: "#22c55e" },
  { day: 17, exercise: "Planche latérale",   icon: "human-handsdown", sets: 2, reps: 30, unit: "sec",  tip: "30 s chaque côté, hanche vers le haut",                color: "#f97316" },
  { day: 18, exercise: "Dips profonds",      icon: "seat",            sets: 4, reps: 12, unit: "reps", tip: "Descends plus bas que 90° si possible",                color: "#2563eb" },
  { day: 19, exercise: "Fentes sautées",     icon: "walk",            sets: 3, reps: 10, unit: "reps", tip: "Explose et change de jambe en l'air",                  color: "#22c55e" },
  { day: 20, exercise: "Mtn Climbers X",     icon: "run-fast",        sets: 4, reps: 20, unit: "reps", tip: "Croise les genoux sous le corps opposé",               color: "#f97316" },
  { day: 21, exercise: "Récupération",       icon: "meditation",      sets: 1, reps: 15, unit: "min",  tip: "Yoga flow ou stretching actif",                        color: "#22c55e" },
  { day: 22, exercise: "Diamond Push-ups",   icon: "arm-flex",        sets: 4, reps: 10, unit: "reps", tip: "Mains en losange, triceps au maximum",                 color: "#2563eb" },
  { day: 23, exercise: "Pistol Squat",       icon: "human",           sets: 3, reps: 5,  unit: "reps", tip: "Squat sur une jambe, 5 reps chaque côté",              color: "#22c55e" },
  { day: 24, exercise: "Planche 45s",        icon: "human-handsdown", sets: 4, reps: 45, unit: "sec",  tip: "Serre les fessiers, ne lâche pas",                     color: "#f97316" },
  { day: 25, exercise: "Dips lestés",        icon: "seat",            sets: 4, reps: 12, unit: "reps", tip: "Ajoute un sac à dos pour résistance",                  color: "#2563eb" },
  { day: 26, exercise: "Fentes+rotation",    icon: "walk",            sets: 3, reps: 12, unit: "reps", tip: "Torsion du tronc en fente basse",                      color: "#22c55e" },
  { day: 27, exercise: "Burpees",            icon: "run-fast",        sets: 4, reps: 10, unit: "reps", tip: "Max effort, 60 s de repos entre séries",               color: "#f97316" },
  { day: 28, exercise: "Récupération",       icon: "meditation",      sets: 1, reps: 20, unit: "min",  tip: "Récupération complète : sommeil, nutrition",            color: "#22c55e" },
  { day: 29, exercise: "Push-ups explosifs", icon: "arm-flex",        sets: 4, reps: 8,  unit: "reps", tip: "Décolle les mains du sol, max puissance",              color: "#2563eb" },
  { day: 30, exercise: "Circuit final",      icon: "fire",            sets: 3, reps: 0,  unit: "",     tip: "10 PU · 15 squats · 45 s planche · 8 burpees",         color: "#f97316" },
];

pool.query(`
  CREATE TABLE IF NOT EXISTS calisthenics_program (
    day_number INT PRIMARY KEY CHECK (day_number >= 1 AND day_number <= 30),
    exercise   TEXT NOT NULL DEFAULT '',
    icon       TEXT NOT NULL DEFAULT 'arm-flex',
    sets       INT  NOT NULL DEFAULT 3,
    reps       INT  NOT NULL DEFAULT 10,
    unit       TEXT NOT NULL DEFAULT 'reps',
    tip        TEXT NOT NULL DEFAULT '',
    color      TEXT NOT NULL DEFAULT '#2563eb'
  );
`).then(async () => {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS cnt FROM calisthenics_program`);
  if (rows[0].cnt === 0) {
    for (const p of DEFAULT_PROGRAM) {
      await pool.query(
        `INSERT INTO calisthenics_program (day_number, exercise, icon, sets, reps, unit, tip, color)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
        [p.day, p.exercise, p.icon, p.sets, p.reps, p.unit, p.tip, p.color]
      );
    }
    console.log("calisthenics_program seeded with 30 days");
  }
}).catch((err) => console.error("calisthenics_program init error:", err));

// GET /api/calisthenics-program — public
router.get("/calisthenics-program", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT day_number, exercise, icon, sets, reps, unit, tip, color
       FROM calisthenics_program ORDER BY day_number ASC`
    );
    res.json(rows.map((r) => ({
      dayNumber: r.day_number,
      exercise: r.exercise,
      icon: r.icon,
      sets: r.sets,
      reps: r.reps,
      unit: r.unit,
      tip: r.tip,
      color: r.color,
    })));
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/calisthenics-program/:day — admin
router.put("/calisthenics-program/:day", requireAuth, async (req, res) => {
  const day = parseInt(req.params.day, 10);
  if (isNaN(day) || day < 1 || day > 30) {
    return res.status(400).json({ error: "Jour invalide (1-30)" });
  }
  const { exercise, icon, sets, reps, unit, tip, color } = req.body;
  if (!exercise) return res.status(400).json({ error: "Exercice requis" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO calisthenics_program (day_number, exercise, icon, sets, reps, unit, tip, color)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (day_number) DO UPDATE
         SET exercise=$2, icon=$3, sets=$4, reps=$5, unit=$6, tip=$7, color=$8
       RETURNING *`,
      [day, exercise, icon ?? "arm-flex", sets ?? 3, reps ?? 10, unit ?? "reps", tip ?? "", color ?? "#2563eb"]
    );
    res.json({ dayNumber: rows[0].day_number, exercise: rows[0].exercise, icon: rows[0].icon, sets: rows[0].sets, reps: rows[0].reps, unit: rows[0].unit, tip: rows[0].tip, color: rows[0].color });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
