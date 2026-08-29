import { prisma } from "../config/prisma";

async function main() {
  const senders = await prisma.sender.findMany();
  console.log("SENDERS COUNT:", senders.length);
  console.log("SENDERS:", JSON.stringify(senders, null, 2));

  const scheduled = await prisma.email.findMany({
    where: { status: { in: ["SCHEDULED", "QUEUED", "RATE_LIMITED"] } },
    include: { sender: true },
  });
  console.log("SCHEDULED EMAILS COUNT:", scheduled.length);
  console.log("SCHEDULED EMAILS:", JSON.stringify(scheduled, null, 2));

  const sent = await prisma.email.findMany({
    where: { status: { in: ["SENT", "FAILED"] } },
    include: { sender: true },
  });
  console.log("SENT EMAILS COUNT:", sent.length);
  console.log("SENT EMAILS:", JSON.stringify(sent, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
