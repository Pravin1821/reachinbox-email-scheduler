import apiClient from './client';
import type {
  GetEmailsResponse,
  ScheduleEmailPayload,
  ScheduleEmailResponse,
  SearchEmailsResponse,
} from '../types';

/**
 * GET /api/emails/scheduled
 * Returns emails with status: SCHEDULED | QUEUED | RATE_LIMITED
 */
export async function getScheduledEmails(): Promise<GetEmailsResponse> {
  const res = await apiClient.get<GetEmailsResponse>('/api/emails/scheduled');
  return res.data;
}

/**
 * GET /api/emails/sent
 * Returns emails with status: SENT | FAILED
 */
export async function getSentEmails(): Promise<GetEmailsResponse> {
  const res = await apiClient.get<GetEmailsResponse>('/api/emails/sent');
  return res.data;
}

/**
 * POST /api/emails/schedule
 * Schedules a single email. Payload: { to, subject, body, senderId, scheduledAt }
 * Note: To schedule bulk from CSV, call this once per recipient with
 * scheduledAt incremented by delaySeconds * index.
 */
export async function scheduleEmail(
  payload: ScheduleEmailPayload,
): Promise<ScheduleEmailResponse> {
  const res = await apiClient.post<ScheduleEmailResponse>('/api/emails/schedule', payload);
  return res.data;
}

/**
 * GET /api/emails/search?q=<query>
 * Elasticsearch-backed full-text search across to, subject, body fields.
 * Returns: { results: Array<{ id, score, to, subject, body, status, senderId, scheduledAt, sentAt }> }
 */
export async function searchEmails(query: string): Promise<SearchEmailsResponse> {
  const res = await apiClient.get<SearchEmailsResponse>('/api/emails/search', {
    params: { q: query },
  });
  return res.data;
}

/**
 * DELETE /api/emails/:id
 * Permanently deletes an email record.
 */
export async function deleteEmail(id: string): Promise<void> {
  await apiClient.delete(`/api/emails/${id}`);
}
