import apiClient from './client';
import type { GetSendersResponse } from '../types';

/**
 * TODO: backend endpoint GET /api/senders not found — confirm with backend dev.
 *
 * The backend has a `Sender` Prisma model (id, name, email, maxEmailsPerHour)
 * and the POST /api/emails/schedule endpoint requires a valid `senderId` UUID,
 * but there is currently NO route that lists available senders.
 *
 * This function will throw an error that the UI must handle gracefully.
 * Once the backend adds GET /api/senders, this will work without UI changes.
 */
export async function getSenders(): Promise<GetSendersResponse> {
  // TODO: backend endpoint GET /api/senders not found, confirm with backend dev
  const res = await apiClient.get<GetSendersResponse>('/api/senders');
  return res.data;
}
