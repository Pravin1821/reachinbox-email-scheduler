import axios from "axios";
import { prisma } from "../config/prisma";

export async function notifyRateLimitHit(senderId: string, limit: number) {
  const connection = await prisma.slackConnection.findFirst();

  if (!connection) {
    console.log(`[slack] no workspace connected — skipping notification for sender ${senderId}`);
    return;
  }

  try {
    await axios.post(
      "https://slack.com/api/chat.postMessage",
      {
        channel: connection.channelId,
        text: `⚠️ *Rate limit hit* — sender \`${senderId}\` reached its hourly cap of *${limit}* emails/hour. Remaining emails have been automatically requeued for the next hour window.`,
      },
      {
        headers: { Authorization: `Bearer ${connection.accessToken}` },
      }
    );
    console.log(`[slack] ✅ rate-limit notification sent to channel ${connection.channelId}`);
  } catch (err: any) {
    console.error(`[slack] failed to send notification:`, err.message);
  }
}