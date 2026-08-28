import { scheduleEmailJob } from "../queues/emailQueue";

async function main() {
  const fakeEmailId = "test-email-" + Date.now();
  const sendAt = new Date(Date.now() + 15_000);

  console.log(`Scheduling fake job ${fakeEmailId} to fire at ${sendAt.toLocaleTimeString()}`);
  await scheduleEmailJob(fakeEmailId, sendAt);
  console.log("Scheduled. Watch the worker terminal...");
  process.exit(0);
}

main();