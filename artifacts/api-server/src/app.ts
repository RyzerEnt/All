import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { join } from "node:path";
import { existsSync } from "node:fs";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.CLERK_SECRET_KEY) {
  const { clerkMiddleware } = await import("@clerk/express");
  const { publishableKeyFromHost } = await import("@clerk/shared/keys");

  app.use(
    clerkMiddleware((req) => ({
      publishableKey: publishableKeyFromHost(
        getClerkProxyHost(req) ?? "",
        process.env.CLERK_PUBLISHABLE_KEY,
      ),
    })),
  );
} else {
  logger.warn("CLERK_SECRET_KEY not set — Clerk auth middleware disabled. /api/me and /api/sessions will return 401.");
}

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const frontendPath = join(process.cwd(), "frontend");
  if (existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get("*", (_req, res) => {
      res.sendFile(join(frontendPath, "index.html"));
    });
  }
}

export default app;
