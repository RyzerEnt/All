import { Router } from "express";
import { db, waitlistTable, waitlistEmailSchema } from "@workspace/db";

const router = Router();

router.post("/waitlist", async (req, res) => {
  const parsed = waitlistEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Adresse email invalide" });
    return;
  }

  try {
    await db.insert(waitlistTable).values({ email: parsed.data.email });
    res.status(201).json({ success: true, message: "Inscription confirmée !" });
  } catch (err: unknown) {
    const isUniqueViolation = (e: unknown): boolean => {
      if (!e || typeof e !== "object") return false;
      const code = (e as { code?: string }).code;
      if (code === "23505") return true;
      const cause = (e as { cause?: unknown }).cause;
      return isUniqueViolation(cause);
    };
    if (isUniqueViolation(err)) {
      res.status(409).json({ error: "Cet email est déjà inscrit." });
      return;
    }
    req.log.error(err, "Failed to insert waitlist entry");
    res.status(500).json({ error: "Erreur serveur, réessaie plus tard." });
  }
});

export default router;
