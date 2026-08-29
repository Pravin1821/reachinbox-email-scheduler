import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { scheduleEmailJob } from "../queues/emailQueue";
import { z } from "zod";
import { indexEmail, ensureEmailIndex } from "../services/search";
import { searchEmails } from "../services/search";

const scheduleEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  senderId: z.string().uuid(),
  scheduledAt: z.coerce.date(),
});

export async function scheduleEmail(req: Request, res: Response) {
  const parsed = scheduleEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { to, subject, body, senderId, scheduledAt } = parsed.data;

  const sender = await prisma.sender.findUnique({ where: { id: senderId } });
  if (!sender) {
    return res.status(404).json({ error: `Sender ${senderId} not found` });
  }

  const email = await prisma.email.create({
    data: { to, subject, body, senderId, scheduledAt, status: "SCHEDULED" },
  });
  await indexEmail({ ...email, sentAt: null });
  try {
    const job = await scheduleEmailJob(email.id, scheduledAt);
    await prisma.email.update({
      where: { id: email.id },
      data: { bullJobId: job.id },
    });
  } catch (err) {
    console.error(`[schedule] failed to enqueue email ${email.id}:`, err);
  }

  return res.status(201).json({ email });
}

export async function getScheduledEmails(req: Request, res: Response) {
  const emails = await prisma.email.findMany({
    where: { status: { in: ["SCHEDULED", "QUEUED", "RATE_LIMITED"] } },
    include: { sender: true },
    orderBy: { scheduledAt: "asc" },
  });
  return res.json({ emails });
}

export async function getSentEmails(req: Request, res: Response) {
  const emails = await prisma.email.findMany({
    where: { status: { in: ["SENT", "FAILED"] } },
    include: { sender: true },
    orderBy: { sentAt: "desc" },
  });
  return res.json({ emails });
}

export async function searchEmailsHandler(req: Request, res: Response) {
  const query = req.query.q as string;
  if (!query) return res.status(400).json({ error: "Missing query param 'q'" });
  const results = await searchEmails(query);
  return res.json({ results });
}