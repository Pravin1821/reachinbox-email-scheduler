import { Worker, Job } from "bullmq";
import { redisConnection } from "../config/redis";
import { EMAIL_QUEUE_NAME } from "../queues/emailQueue";
import { prisma } from "../config/prisma";
import { sendEmail } from "../services/mailer";

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
    await prisma.email.update({
      where: { id: emailId },
      data: { status: "PROCESSING" },
    });

    try {
      const { messageId, previewUrl } = await sendEmail({
        to: email.to,
        subject: email.subject,
        body: email.body,
        fromName: email.sender.name,
      });

      await prisma.email.update({
        where: { id: emailId },
        data: { status: "SENT", sentAt: new Date() },
      });

      console.log(`[worker] ✅ sent ${emailId} — preview: ${previewUrl}`);
      return { messageId, previewUrl };
    } catch (err: any) {
      await prisma.email.update({
        where: { id: emailId },
        data: { status: "FAILED", failureReason: err.message },
      });
      console.error(`[worker] ❌ send failed for ${emailId}:`, err.message);
      throw err; 
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  console.log(`[worker] job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] job ${job?.id} failed permanently:`, err.message);
});

console.log("[worker] email worker started, waiting for jobs...");