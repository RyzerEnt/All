import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Non autorise" });
    return;
  }
  const token = header.slice(7);
  try {
    const secret = process.env.JWT_SECRET ?? "fallback-secret";
    req.user = jwt.verify(token, secret) as { email: string; role: string };
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expire" });
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: { email: string; role: string };
    }
  }
}
