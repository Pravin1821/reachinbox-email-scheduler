import apiClient from './client';
import type { SlackStatus } from '../types';

/**
 * GET /api/slack/status  (requires auth)
 * Returns whether a Slack workspace is currently connected.
 */
export async function getSlackStatus(): Promise<SlackStatus> {
  const res = await apiClient.get<SlackStatus>('/api/slack/status');
  return res.data;
}

/**
 * DELETE /api/slack  (requires auth)
 * Disconnects Slack by deleting all SlackConnection rows.
 */
export async function disconnectSlack(): Promise<{ success: boolean }> {
  const res = await apiClient.delete<{ success: boolean }>('/api/slack');
  return res.data;
}
