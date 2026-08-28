import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis";
import { EMAIL_QUEUE_NAME } from "../queues/emailQueue";

const worker = new Worker(
  EMAIL_QUEUE_NAME,
  async (job: Job) => {
    console.log(`[worker] processing job ${job.id} — payload:`, job.data);
    console.log(`[worker] (this is where Ethereal sending goes in Phase 5)`);
    return { processedAt: new Date().toISOString() };
  },
  {
    connection: redisConnection,
    concurrency: 5, 
  }
);

worker.on("completed", (job) => {
  console.log(`[worker] ✅ job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] ❌ job ${job?.id} failed:`, err.message);
});

console.log("[worker] email worker started, waiting for jobs...");