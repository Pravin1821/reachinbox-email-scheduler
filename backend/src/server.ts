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

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: "none",
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

async function start() {
  await ensureEmailIndex().catch(() => console.warn("[search] skipping ES init — not critical for deploy demo"));
  await reconcileOnBoot();
  app.listen(env.PORT, () => {
    console.log(`[server] listening on port ${env.PORT}`);
  });
}

start();