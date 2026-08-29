import { Router } from "express";
import { prisma } from "../config/prisma";
import { exchangeSlackCode } from "../services/slackAuth";
import { env } from "../config/env";
import { requireAuth } from "../middleware/auth";

const router = Router();

/**
 * GET /api/slack/connect  (requireAuth)
 * Redirects the user to Slack's OAuth authorization URL.
 */
router.get("/connect", requireAuth, (req, res) => {
  const scopes = "chat:write,channels:read";
  const url = `https://slack.com/oauth/v2/authorize?client_id=${env.SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(env.SLACK_REDIRECT_URI)}`;
  res.redirect(url);
});

/**
 * GET /api/slack/callback
 * Slack OAuth callback — exchanges code for access token and stores connection.
 */
router.get("/callback", async (req, res) => {
  const code = req.query.code as string;
  if (!code) return res.status(400).send("Missing code");

  try {
    const result = await exchangeSlackCode(code);
    await prisma.slackConnection.upsert({
      where: { teamId: result.team.id },
      update: { accessToken: result.access_token },
      create: {
        teamId: result.team.id,
        accessToken: result.access_token,
        channelId: env.SLACK_DEFAULT_CHANNEL_ID,
      },
    });

    res.redirect(`${env.FRONTEND_URL}/dashboard?slack=connected`);
  } catch (err: any) {
    console.error("[slack] OAuth callback failed:", err.message);
    res.redirect(`${env.FRONTEND_URL}/dashboard?slack=error`);
  }
});

/**
 * GET /api/slack/status  (requireAuth)
 * Returns whether a Slack workspace is connected.
 * Response: { connected: boolean, teamId?: string, channelId?: string }
 */
router.get("/status", requireAuth, async (req, res) => {
  const connection = await prisma.slackConnection.findFirst();
  if (!connection) {
    return res.json({ connected: false });
  }
  return res.json({
    connected: true,
    teamId: connection.teamId,
    channelId: connection.channelId,
  });
});

/**
 * DELETE /api/slack  (requireAuth)
 * Disconnects Slack by deleting all SlackConnection rows.
 * Response: { success: true }
 */
router.delete("/", requireAuth, async (req, res) => {
  await prisma.slackConnection.deleteMany();
  console.log("[slack] workspace disconnected via API");
  return res.json({ success: true });
});

export default router;