import express from "express";
import cors from "cors";
import session from "express-session";
// REMOVE: import { RedisStore } from "connect-redis";
// REMOVE: import { sessionRedisClient, connectSessionRedis } from "./config/sessionRedis";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { env } from "./config/env";
import passport from "./config/passport";
import emailRoutes from "./routes/emailRoutes";
import authRoutes from "./routes/authRoutes";
import senderRoutes from "./routes/senderRoutes";
import slackRoutes from "./routes/slackRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { reconcileOnBoot } from "./services/reconciler";
import { ensureEmailIndex } from "./services/search";
import { emailQueue } from "./queues/emailQueue";

const app = express();
app.set("trust proxy", 1);

const cleanFrontendUrl = env.FRONTEND_URL.replace(/\/+$/, "");
const isCrossDomain =
  cleanFrontendUrl.startsWith("https://") ||
  process.env.NODE_ENV === "production";

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, "");
      if (
        cleanOrigin === cleanFrontendUrl ||
        cleanOrigin.endsWith(".vercel.app") ||
        cleanOrigin.startsWith("http://localhost") ||
        cleanOrigin.startsWith("http://127.0.0.1")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: isCrossDomain,
      sameSite: isCrossDomain ? "none" : "lax",
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");
createBullBoard({ queues: [new BullMQAdapter(emailQueue)], serverAdapter });
app.use("/admin/queues", serverAdapter.getRouter());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/senders", senderRoutes);
app.use("/api/slack", slackRoutes);

app.use(errorHandler);

import { prisma } from "./config/prisma";

async function ensureDefaultSender() {
  if (env.ETHEREAL_USER) {
    await prisma.sender.upsert({
      where: { email: env.ETHEREAL_USER },
      update: {},
      create: {
        name: "ReachInbox (Ethereal)",
        email: env.ETHEREAL_USER,
        maxEmailsPerHour: 200,
      },
    });
    console.log(`[senders] default Ethereal sender ready: ${env.ETHEREAL_USER}`);
  }
}

async function start() {
  app.listen(env.PORT, () => {
    console.log(`[server] listening on port ${env.PORT}`);
  });
  ensureDefaultSender().catch((err) =>
    console.error("[senders] failed to seed default sender:", err.message)
  );
  reconcileOnBoot().catch((err) => {
    console.error("[reconciler] failed to complete:", err.message);
  });
  ensureEmailIndex().catch(() =>
    console.warn("[search] skipping ES init — not critical for deploy demo")
  );
}

start();
