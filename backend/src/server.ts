import express from "express";
import cors from "cors";
import { env } from "./config/env";
import emailRoutes from "./routes/emailRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { reconcileOnBoot } from "./services/reconciler";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/emails", emailRoutes);

app.use(errorHandler);

async function start() {
  await reconcileOnBoot(); 
  app.listen(env.PORT, () => {
    console.log(`[server] listening on http://localhost:${env.PORT}`);
  });
}

start();