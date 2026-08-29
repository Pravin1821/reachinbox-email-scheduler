import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis";
import { EMAIL_QUEUE_NAME, scheduleEmailJob } from "../queues/emailQueue";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
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

    if (!emailId) {
      throw new Error(
        `Job ${job.id} has malformed data — no emailId found. Raw job.data: ${JSON.stringify(job.data)}`
      );
    }

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

      await prisma.email.update({
        where: { id: emailId },
        data: { status: "RATE_LIMITED", nextAttemptAt: nextWindowStart },
      });

      await scheduleEmailJob(emailId, nextWindowStart);

      console.warn(
        `[worker] rate limit hit for sender ${email.senderId} ` +
        `(${rateLimitResult.currentCount}/${rateLimitResult.limit}) — ` +
        `requeued ${emailId} for ${nextWindowStart.toISOString()}`
      );

      await notifyRateLimitHit(email.senderId, rateLimitResult.limit);

      return { rateLimited: true, requeuedFor: nextWindowStart.toISOString() };
    }

    try {
      const { messageId, previewUrl } = await sendEmail({
        to: email.to,
        subject: email.subject,
        body: email.body,
        fromName: email.sender.name,
      });

      await prisma.email.update({
        where: { id: emailId },
        data: {
          status: "SENT",
          sentAt: new Date(),
          nextAttemptAt: null,
          previewUrl: previewUrl ? String(previewUrl) : null,
        },
      });

      await indexEmail({
        ...email,
        status: "SENT",
        sentAt: new Date(),
        previewUrl: previewUrl ? String(previewUrl) : null,
      });
      return { messageId, previewUrl };
    } catch (err: any) { // nodemailer/transport errors may not extend native Error
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
    concurrency: env.WORKER_CONCURRENCY,
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