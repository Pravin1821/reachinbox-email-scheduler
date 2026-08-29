import express from "express";
import cors from "cors";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { env } from "./config/env";
import emailRoutes from "./routes/emailRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { reconcileOnBoot } from "./services/reconciler";
import { emailQueue } from "./queues/emailQueue";
import { ensureEmailIndex } from "./services/search";

const app = express();

app.use(cors());
app.use(express.json());

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");
createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});
app.use("/admin/queues", serverAdapter.getRouter());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/emails", emailRoutes);

app.use(errorHandler);

async function start() {
  await ensureEmailIndex();
  await reconcileOnBoot();
  app.listen(env.PORT, () => {
    console.log(`[server] listening on http://localhost:${env.PORT}`);
    console.log(`[server] bull-board dashboard: http://localhost:${env.PORT}/admin/queues`);
  });
}

start();