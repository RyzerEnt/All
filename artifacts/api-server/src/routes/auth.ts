import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/auth/login", (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET ?? "fallback-secret";

  if (!email || !password || email !== adminEmail || password !== adminPassword) {
    res.status(401).json({ error: "Identifiants invalides" });
    return;
  }

  const token = jwt.sign({ email, role: "admin" }, jwtSecret, { expiresIn: "24h" });
  res.json({ token });
});

export default router;
