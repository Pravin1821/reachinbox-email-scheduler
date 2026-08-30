import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { z } from "zod";

/**
 * GET /api/senders
 * Returns all Sender rows ordered by creation date.
 * Automatically ensures the default Ethereal sender exists if DB has no senders.
 */
export async function getSenders(req: Request, res: Response) {
  let senders = await prisma.sender.findMany({
    orderBy: { createdAt: "asc" },
  });

  if (senders.length === 0 && env.ETHEREAL_USER) {
    const defaultSender = await prisma.sender.upsert({
      where: { email: env.ETHEREAL_USER },
      update: {},
      create: {
        name: "ReachInbox (Ethereal)",
        email: env.ETHEREAL_USER,
        maxEmailsPerHour: 200,
      },
    });
    senders = [defaultSender];
  }

  return res.json({ senders });
}

const createSenderSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  maxEmailsPerHour: z.number().int().positive().default(200),
});

/**
 * POST /api/senders
 * Creates a new Sender row. Primarily used to seed test data from the UI.
 */
export async function createSender(req: Request, res: Response) {
  const parsed = createSenderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { name, email, maxEmailsPerHour } = parsed.data;

  // Check for duplicate email
  const existing = await prisma.sender.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: `Sender with email "${email}" already exists.` });
  }

  const sender = await prisma.sender.create({
    data: { name, email, maxEmailsPerHour },
  });

  return res.status(201).json({ sender });
}
