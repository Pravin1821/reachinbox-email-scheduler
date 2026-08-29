import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis";
import { EMAIL_QUEUE_NAME, emailQueue } from "../queues/emailQueue";
import { prisma } from "../config/prisma";
import { sendEmail } from "../services/mailer";
import {
  checkAndIncrementRateLimit,
  rollbackRateLimitIncrement,
  getNextHourWindowStart,
} from "../services/rateLimiter";
import { notifyRateLimitHit } from "../services/slack"; 
import { indexEmail } from "../services/search";

const worker = new Worker(
  EMAIL_QUEUE_NAME,
  async (job: Job) => {
    const { emailId } = job.data;

    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: { sender: true },
    });

    if (!email) {
      console.warn(`[worker] email ${emailId} not found in DB, skipping`);
      return { skipped: true };
    }

    const rateLimitResult = await checkAndIncrementRateLimit(
      email.senderId,
      email.sender.maxEmailsPerHour
    );

    if (!rateLimitResult.allowed) {
      await rollbackRateLimitIncrement(email.senderId);

      const nextWindowStart = getNextHourWindowStart(new Date());
      const newDelayMs = nextWindowStart.getTime() - Date.now();

      await prisma.email.update({
        where: { id: emailId },
        data: { status: "RATE_LIMITED", nextAttemptAt: nextWindowStart },
      });

      await emailQueue.add(
        "send-email",
        { emailId },
        { jobId: emailId, delay: newDelayMs }
      );

      console.warn(
        `[worker] rate limit hit for sender ${email.senderId} ` +
        `(${rateLimitResult.currentCount}/${rateLimitResult.limit}) — ` +
        `requeued ${emailId} for ${nextWindowStart.toISOString()}`
      );

      await notifyRateLimitHit(email.senderId, rateLimitResult.limit);

      return { rateLimited: true, requeuedFor: nextWindowStart.toISOString() };
    }

   await prisma.email.update({
  where: { id: emailId },
  data: { status: "SENT", sentAt: new Date() },
});
await indexEmail({ ...email, status: "SENT", sentAt: new Date() });

    try {
      const { messageId, previewUrl } = await sendEmail({
        to: email.to,
        subject: email.subject,
        body: email.body,
        fromName: email.sender.name,
      });

      await prisma.email.update({
        where: { id: emailId },
        data: { status: "SENT", sentAt: new Date(), nextAttemptAt: null },
      });

      await indexEmail({ ...email, status: "SENT", sentAt: new Date() });
      return { messageId, previewUrl };
    } catch (err: any) {
      await prisma.email.update({
        where: { id: emailId },
        data: { status: "FAILED", failureReason: err.message },
      });
      await indexEmail({ ...email, status: "FAILED", sentAt: null });
      throw err;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

worker.on("completed", (job) => console.log(`[worker] job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`[worker] job ${job?.id} failed permanently:`, err.message));

console.log("[worker] email worker started, waiting for jobs...");

async function shutdown(signal: string) {
  console.log(`[worker] received ${signal}, closing gracefully...`);
  await worker.close(); 
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));