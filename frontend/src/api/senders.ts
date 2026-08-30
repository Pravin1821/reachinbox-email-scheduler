import apiClient from './client';
import type { GetSendersResponse, CreateSenderPayload, CreateSenderResponse, Sender } from '../types';

const STORAGE_KEY = 'reachinbox_senders';

const DEFAULT_SENDERS: Sender[] = [
  {
    id: 'sender-default-ethereal',
    name: 'ReachInbox (Ethereal)',
    email: 'test@ethereal.email',
    maxEmailsPerHour: 200,
    createdAt: new Date().toISOString(),
  },
];

function getLocalSenders(): Sender[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_SENDERS;
  } catch {
    return DEFAULT_SENDERS;
  }
}

function saveLocalSenders(senders: Sender[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(senders));
  } catch {
    // ignore
  }
}

/**
 * GET /api/senders
 * Returns all Sender rows from the database (or local storage fallback).
 */
export async function getSenders(): Promise<GetSendersResponse> {
  try {
    const res = await apiClient.get<GetSendersResponse>('/api/senders');
    if (res.data?.senders && res.data.senders.length > 0) {
      saveLocalSenders(res.data.senders);
      return res.data;
    }
  } catch (err) {
    console.warn('Backend senders unavailable, using local mock data:', err);
  }
  return { senders: getLocalSenders() };
}

/**
 * POST /api/senders
 * Creates a new Sender.
 */
export async function createSender(
  payload: CreateSenderPayload,
): Promise<CreateSenderResponse> {
  try {
    const res = await apiClient.post<CreateSenderResponse>('/api/senders', payload);
    return res.data;
  } catch (err) {
    console.warn('Backend createSender unavailable, using local mock data:', err);
  }

  const local = getLocalSenders();
  const newSender: Sender = {
    id: `sender_${Date.now()}`,
    name: payload.name,
    email: payload.email,
    maxEmailsPerHour: payload.maxEmailsPerHour || 200,
    createdAt: new Date().toISOString(),
  };
  const updated = [newSender, ...local];
  saveLocalSenders(updated);
  return { sender: newSender };
}
