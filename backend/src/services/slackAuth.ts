import axios from "axios";
import { env } from "../config/env";

interface SlackOAuthResponse {
  ok: boolean;
  access_token: string;
  team: { id: string; name: string };
  incoming_webhook?: { channel_id: string };
  error?: string;
}
export async function exchangeSlackCode(code: string): Promise<SlackOAuthResponse> {
  const response = await axios.post<SlackOAuthResponse>(
    "https://slack.com/api/oauth.v2.access",
    null,
    {
      params: {
        client_id: env.SLACK_CLIENT_ID,
        client_secret: env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: env.SLACK_REDIRECT_URI,
      },
    }
  );

  if (!response.data.ok) {
    throw new Error(`Slack OAuth failed: ${response.data.error}`);
  }

  return response.data;
}