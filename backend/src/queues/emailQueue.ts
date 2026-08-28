import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const EMAIL_QUEUE_NAME = "email-send";

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
});

export async function scheduleEmailJob(emailId: string, scheduledAt: Date) {
  const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());

  const job = await emailQueue.add(
    "send-email",
    { emailId },
    {
      jobId: emailId,
      delay: delayMs,
      removeOnComplete: false, 
      removeOnFail: false,
      attempts: 3,        
      backoff: { type: "exponential", delay: 2000 },
    }
  );

  return job;
}