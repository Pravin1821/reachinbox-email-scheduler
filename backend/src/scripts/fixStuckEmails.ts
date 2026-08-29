import { prisma } from "../config/prisma";
import { emailQueue, scheduleEmailJob } from "../queues/emailQueue";

export async function fixStuckEmails() {
  const cutoffTime = new Date(Date.now() - 5 * 60 * 1000);
  console.log(`[fixStuckEmails] Searching for SCHEDULED emails older than ${cutoffTime.toISOString()}...`);

  const stuckEmails = await prisma.email.findMany({
    where: {
      status: { in: ["SCHEDULED", "RATE_LIMITED"] },
      scheduledAt: {
        lte: cutoffTime,
      },
    },
    include: { sender: true },
  });

  console.log(`[fixStuckEmails] Found ${stuckEmails.length} stuck email(s).`);

  let fixedCount = 0;

  for (const email of stuckEmails) {
    console.log(`[fixStuckEmails] Fixing stuck email ${email.id} (To: ${email.to}, Originally scheduled: ${email.scheduledAt.toISOString()})...`);

    // Remove dead/completed/failed job from Redis if present so BullMQ allows rescheduling with the same jobId
    const existingJob = await emailQueue.getJob(email.id);
    if (existingJob) {
      const state = await existingJob.getState();
      console.log(`[fixStuckEmails] Found existing BullMQ job ${email.id} in state '${state}'. Removing before reschedule.`);
      await existingJob.remove();
    }

    // Clear bullJobId in database
    await prisma.email.update({
      where: { id: email.id },
      data: { bullJobId: null },
    });

    // Reschedule for immediate execution
    const newJob = await scheduleEmailJob(email.id, new Date());

    // Update with new job ID
    await prisma.email.update({
      where: { id: email.id },
      data: { bullJobId: newJob.id },
    });

    fixedCount++;
    console.log(`[fixStuckEmails] Rescheduled email ${email.id} with job ID ${newJob.id}.`);
  }

  console.log(`[fixStuckEmails] Completed. Successfully fixed and rescheduled ${fixedCount} email(s).`);
  return fixedCount;
}

if (require.main === module) {
  fixStuckEmails()
    .catch((err) => {
      console.error("[fixStuckEmails] Error running fix script:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
      await emailQueue.close();
      process.exit(0);
    });
}
