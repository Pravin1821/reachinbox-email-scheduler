import apiClient from './client';
import type {
  Email,
  GetEmailsResponse,
  ScheduleEmailPayload,
  ScheduleEmailResponse,
  SearchEmailsResponse,
} from '../types';

const STORAGE_KEY_SCHEDULED = 'reachinbox_scheduled_emails';
const STORAGE_KEY_SENT = 'reachinbox_sent_emails';

const INITIAL_SCHEDULED: Email[] = [
  {
    id: 'em-sched-1',
    to: 'sarah.connor@cyberdyne.com',
    subject: 'Quarterly Campaign Strategy Review',
    body: 'Hi Sarah,\n\nFollowing up on our campaign goals for Q3. Looking forward to our discussion next Tuesday.\n\nBest regards,\nReachInbox Team',
    status: 'SCHEDULED',
    senderId: 'sender-default-ethereal',
    scheduledAt: new Date(Date.now() + 3600000).toISOString(),
    sentAt: null,
    nextAttemptAt: null,
    bullJobId: null,
    failureReason: null,
    previewUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sender: {
      id: 'sender-default-ethereal',
      name: 'ReachInbox (Ethereal)',
      email: 'test@ethereal.email',
      maxEmailsPerHour: 200,
      createdAt: new Date().toISOString(),
    },
  },
  {
    id: 'em-sched-2',
    to: 'alex.smith@acme.org',
    subject: 'Product Demo & Walkthrough Invitation',
    body: 'Hello Alex,\n\nWe have prepared the tailored demo environment for your marketing team.\n\nCheers,\nReachInbox Team',
    status: 'SCHEDULED',
    senderId: 'sender-default-ethereal',
    scheduledAt: new Date(Date.now() + 7200000).toISOString(),
    sentAt: null,
    nextAttemptAt: null,
    bullJobId: null,
    failureReason: null,
    previewUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sender: {
      id: 'sender-default-ethereal',
      name: 'ReachInbox (Ethereal)',
      email: 'test@ethereal.email',
      maxEmailsPerHour: 200,
      createdAt: new Date().toISOString(),
    },
  },
];

const INITIAL_SENT: Email[] = [
  {
    id: 'em-sent-1',
    to: 'john.doe@example.com',
    subject: 'Welcome to ReachInbox Email Scheduler!',
    body: 'Hi John,\n\nThank you for signing up for ReachInbox. Your email delivery pipeline is fully configured.\n\nBest,\nReachInbox Team',
    status: 'SENT',
    senderId: 'sender-default-ethereal',
    scheduledAt: new Date(Date.now() - 7200000).toISOString(),
    sentAt: new Date(Date.now() - 7190000).toISOString(),
    nextAttemptAt: null,
    bullJobId: null,
    failureReason: null,
    previewUrl: 'https://ethereal.email',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7190000).toISOString(),
    sender: {
      id: 'sender-default-ethereal',
      name: 'ReachInbox (Ethereal)',
      email: 'test@ethereal.email',
      maxEmailsPerHour: 200,
      createdAt: new Date().toISOString(),
    },
  },
];

function getLocalEmails(key: string, defaultData: Email[]): Email[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultData;
  } catch {
    return defaultData;
  }
}

function saveLocalEmails(key: string, emails: Email[]) {
  try {
    localStorage.setItem(key, JSON.stringify(emails));
  } catch {
    // ignore
  }
}

/**
 * GET /api/emails/scheduled
 */
export async function getScheduledEmails(): Promise<GetEmailsResponse> {
  try {
    const res = await apiClient.get<GetEmailsResponse>('/api/emails/scheduled');
    if (res.data?.emails) {
      saveLocalEmails(STORAGE_KEY_SCHEDULED, res.data.emails);
      return res.data;
    }
  } catch (err) {
    console.warn('Backend scheduled emails unavailable, using local mock data:', err);
  }
  return { emails: getLocalEmails(STORAGE_KEY_SCHEDULED, INITIAL_SCHEDULED) };
}

/**
 * GET /api/emails/sent
 */
export async function getSentEmails(): Promise<GetEmailsResponse> {
  try {
    const res = await apiClient.get<GetEmailsResponse>('/api/emails/sent');
    if (res.data?.emails) {
      saveLocalEmails(STORAGE_KEY_SENT, res.data.emails);
      return res.data;
    }
  } catch (err) {
    console.warn('Backend sent emails unavailable, using local mock data:', err);
  }
  return { emails: getLocalEmails(STORAGE_KEY_SENT, INITIAL_SENT) };
}

/**
 * POST /api/emails/schedule
 */
export async function scheduleEmail(
  payload: ScheduleEmailPayload,
): Promise<ScheduleEmailResponse> {
  try {
    const res = await apiClient.post<ScheduleEmailResponse>('/api/emails/schedule', payload);
    return res.data;
  } catch (err) {
    console.warn('Backend scheduleEmail unavailable, using local mock data:', err);
  }

  const newEmail: Email = {
    id: `email_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    to: payload.to,
    subject: payload.subject,
    body: payload.body,
    status: 'SCHEDULED',
    senderId: payload.senderId,
    scheduledAt: payload.scheduledAt,
    sentAt: null,
    nextAttemptAt: null,
    bullJobId: null,
    failureReason: null,
    previewUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sender: {
      id: payload.senderId,
      name: 'ReachInbox (Ethereal)',
      email: 'test@ethereal.email',
      maxEmailsPerHour: 200,
      createdAt: new Date().toISOString(),
    },
  };

  const list = getLocalEmails(STORAGE_KEY_SCHEDULED, INITIAL_SCHEDULED);
  const updated = [newEmail, ...list];
  saveLocalEmails(STORAGE_KEY_SCHEDULED, updated);

  return { email: newEmail };
}

/**
 * GET /api/emails/search?q=<query>
 */
export async function searchEmails(query: string): Promise<SearchEmailsResponse> {
  try {
    const res = await apiClient.get<SearchEmailsResponse>('/api/emails/search', {
      params: { q: query },
    });
    return res.data;
  } catch (err) {
    console.warn('Backend search unavailable, searching local data:', err);
  }

  const q = query.toLowerCase();
  const allEmails = [
    ...getLocalEmails(STORAGE_KEY_SCHEDULED, INITIAL_SCHEDULED),
    ...getLocalEmails(STORAGE_KEY_SENT, INITIAL_SENT),
  ];
  const filtered = allEmails.filter(
    (e) =>
      e.to.toLowerCase().includes(q) ||
      e.subject.toLowerCase().includes(q) ||
      e.body.toLowerCase().includes(q),
  );

  return {
    results: filtered.map((e) => ({
      id: e.id,
      score: 1.0,
      to: e.to,
      subject: e.subject,
      body: e.body,
      status: e.status,
      senderId: e.senderId,
      scheduledAt: e.scheduledAt,
      sentAt: e.sentAt,
    })),
  };
}

/**
 * DELETE /api/emails/:id
 */
export async function deleteEmail(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/emails/${id}`);
  } catch (err) {
    console.warn('Backend deleteEmail unavailable, deleting from local data:', err);
  }

  const sched = getLocalEmails(STORAGE_KEY_SCHEDULED, INITIAL_SCHEDULED).filter((e) => e.id !== id);
  const sent = getLocalEmails(STORAGE_KEY_SENT, INITIAL_SENT).filter((e) => e.id !== id);
  saveLocalEmails(STORAGE_KEY_SCHEDULED, sched);
  saveLocalEmails(STORAGE_KEY_SENT, sent);
}
