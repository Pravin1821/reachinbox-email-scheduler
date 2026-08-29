import apiClient from './client';
import type { GetSendersResponse, CreateSenderPayload, CreateSenderResponse } from '../types';

/**
 * GET /api/senders
 * Returns all Sender rows from the database.
 */
export async function getSenders(): Promise<GetSendersResponse> {
  const res = await apiClient.get<GetSendersResponse>('/api/senders');
  return res.data;
}

/**
 * POST /api/senders
 * Creates a new Sender. Used to seed test data from the UI when no senders exist.
 */
export async function createSender(
  payload: CreateSenderPayload,
): Promise<CreateSenderResponse> {
  const res = await apiClient.post<CreateSenderResponse>('/api/senders', payload);
  return res.data;
}
