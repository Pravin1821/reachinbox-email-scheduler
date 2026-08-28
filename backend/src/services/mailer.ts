import nodemailer from "nodemailer";
import { env } from "../config/env";

const transporter = nodemailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: env.ETHEREAL_USER,
    pass: env.ETHEREAL_PASS,
  },
});

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  fromName?: string;
}

export async function sendEmail(input: SendEmailInput) {
  const info = await transporter.sendMail({
    from: `"${input.fromName || "ReachInbox Scheduler"}" <${env.ETHEREAL_USER}>`,
    to: input.to,
    subject: input.subject,
    text: input.body,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  return { messageId: info.messageId, previewUrl };
}