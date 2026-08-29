import { prisma } from "../config/prisma";
import { sendEmail } from "../services/mailer";
import { indexEmail } from "../services/search";
import { scheduleEmailJob } from "../queues/emailQueue";

async function main() {
  // 1. Get or create sender
  let sender = await prisma.sender.findFirst();
  if (!sender) {
    sender = await prisma.sender.create({
      data: {
        name: "Amanda Clark",
        email: "amanda.clark@example.com",
        maxEmailsPerHour: 50,
      },
    });
  }

  // 2. Create a scheduled email in the future
  const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 2); // 2 hours from now
  const scheduledEmail = await prisma.email.create({
    data: {
      to: "sarah.connor@cyberdyne.io",
      subject: "Product Launch Roadmap Review",
      body: "<p>Hi Sarah, attaching the finalized product launch roadmap for Q3. Please review the timelines and deliverables before our sync tomorrow.</p>",
      senderId: sender.id,
      status: "SCHEDULED",
      scheduledAt: futureDate,
    },
  });

  try {
    const job = await scheduleEmailJob(scheduledEmail.id, futureDate);
    await prisma.email.update({
      where: { id: scheduledEmail.id },
      data: { bullJobId: job.id },
    });
  } catch (err) {
    console.warn("Queue scheduling warning:", err);
  }
  await indexEmail({ ...scheduledEmail, sentAt: null });
  console.log("Created scheduled email:", scheduledEmail.id);

  // 3. Create another scheduled email
  const futureDate2 = new Date(Date.now() + 1000 * 60 * 60 * 4); // 4 hours from now
  const scheduledEmail2 = await prisma.email.create({
    data: {
      to: "alex.rivas@reachinbox.ai",
      subject: "Weekly Performance Metrics Summary",
      body: "<p>Hey Alex, here is the weekly breakdown of email throughput, worker concurrency, and rate-limiting triggers across all accounts.</p>",
      senderId: sender.id,
      status: "SCHEDULED",
      scheduledAt: futureDate2,
    },
  });
  await indexEmail({ ...scheduledEmail2, sentAt: null });
  console.log("Created scheduled email 2:", scheduledEmail2.id);

  // 4. Send a real email now via Ethereal to get a valid previewUrl
  console.log("Sending real email via Ethereal SMTP to obtain previewUrl...");
  const mailResult = await sendEmail({
    to: "oliver.brown@domain.io",
    subject: "Welcome to ReachInbox Platform",
    body: "Hi Oliver, welcome onboard! Your email scheduler workspace is ready to go.",
    fromName: sender.name,
  });

  console.log("Ethereal send result:", mailResult);

  const sentEmail = await prisma.email.create({
    data: {
      to: "oliver.brown@domain.io",
      subject: "Welcome to ReachInbox Platform",
      body: "<p>Hi Oliver, welcome onboard! Your email scheduler workspace is ready to go.</p>",
      senderId: sender.id,
      status: "SENT",
      scheduledAt: new Date(Date.now() - 1000 * 60 * 5),
      sentAt: new Date(),
      previewUrl: mailResult.previewUrl ? String(mailResult.previewUrl) : null,
    },
  });

  await indexEmail({
    ...sentEmail,
    status: "SENT",
    sentAt: sentEmail.sentAt,
    previewUrl: sentEmail.previewUrl,
  });
  console.log("Created sent email with previewUrl:", sentEmail.id, sentEmail.previewUrl);

  // Also update an existing sent email to have the previewUrl if needed
  if (mailResult.previewUrl) {
    const prevSent = await prisma.email.findFirst({
      where: { status: "SENT", previewUrl: null },
    });
    if (prevSent) {
      await prisma.email.update({
        where: { id: prevSent.id },
        data: { previewUrl: String(mailResult.previewUrl) },
      });
      console.log("Updated previous sent email with previewUrl:", prevSent.id);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
