import express from "express";
import cors from "cors";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { sessionRedisClient, connectSessionRedis } from "./config/sessionRedis";
import { redisConnection } from "./config/redis";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { env } from "./config/env";
import passport from "./config/passport";
import emailRoutes from "./routes/emailRoutes";
import authRoutes from "./routes/authRoutes";
import senderRoutes from "./routes/senderRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { reconcileOnBoot } from "./services/reconciler";
import { ensureEmailIndex } from "./services/search";
import { emailQueue } from "./queues/emailQueue";
import slackRoutes from "./routes/slackRoutes";

const app = express();

app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '25mb' }));

app.use(
  session({
    store: new RedisStore({ client: sessionRedisClient, prefix: "sess:" }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: false },
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
app.use("/api/senders", senderRoutes);
app.use("/api/slack", slackRoutes);
app.use("/api/emails", emailRoutes);

app.use(errorHandler);

async function start() {
  await connectSessionRedis();
  await ensureEmailIndex();
  await reconcileOnBoot();
  app.listen(env.PORT, () => {
    console.log(`[server] listening on http://localhost:${env.PORT}`);
    console.log(`[server] bull-board dashboard: http://localhost:${env.PORT}/admin/queues`);
  });
}

start();