import { prisma } from "../config/prisma";
import { emailQueue, scheduleEmailJob } from "../queues/emailQueue";
export async function reconcileOnBoot() {
  console.log("[reconciler] starting boot reconciliation...");
  const stuckProcessing = await prisma.email.findMany({ where: { status: "PROCESSING" } });
  for (const email of stuckProcessing) {
    console.warn(`[reconciler] email ${email.id} stuck in PROCESSING — resetting for retry`);
    await prisma.email.update({
      where: { id: email.id },
      data: { status: "SCHEDULED", bullJobId: null },
    });
  }

  const candidates = await prisma.email.findMany({
    where: { status: { in: ["SCHEDULED", "RATE_LIMITED"] } },
  });

  let reenqueued = 0;
  for (const email of candidates) {
    const runAt = email.nextAttemptAt ?? email.scheduledAt;
    const existingJob = await emailQueue.getJob(email.id);

    if (existingJob) {
      const state = await existingJob.getState();
      if (state === "completed" || state === "failed") {
        await existingJob.remove();
      } else {
        continue; 
      }
    }

    const job = await scheduleEmailJob(email.id, runAt);
    await prisma.email.update({ where: { id: email.id }, data: { bullJobId: job.id } });
    reenqueued++;
    console.log(`[reconciler] re-enqueued orphaned email ${email.id} for ${runAt.toISOString()}`);
  }

  console.log(
    `[reconciler] done — ${reenqueued} orphaned email(s) re-enqueued, ` +
    `${stuckProcessing.length} stuck PROCESSING row(s) reset for retry.`
  );
}