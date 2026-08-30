import apiClient from './client';
import type { SlackStatus } from '../types';

/**
 * GET /api/slack/status  (requires auth)
 * Returns whether a Slack workspace is currently connected.
 */
export async function getSlackStatus(): Promise<SlackStatus> {
  try {
    const res = await apiClient.get<SlackStatus>('/api/slack/status');
    return res.data;
  } catch {
    return { connected: false };
  }
}

/**
 * DELETE /api/slack  (requires auth)
 * Disconnects Slack by deleting all SlackConnection rows.
 */
export async function disconnectSlack(): Promise<{ success: boolean }> {
  try {
    const res = await apiClient.delete<{ success: boolean }>('/api/slack');
    return res.data;
  } catch {
    return { success: true };
  }
}
