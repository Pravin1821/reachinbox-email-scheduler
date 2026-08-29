// ─── Email Status ──────────────────────────────────────────────────────────
export type EmailStatus =
  | 'SCHEDULED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'SENT'
  | 'FAILED'
  | 'RATE_LIMITED';

// ─── Sender ────────────────────────────────────────────────────────────────
export interface Sender {
  id: string;
  name: string;
  email: string;
  maxEmailsPerHour: number;
  createdAt: string;
}

// ─── Email Attachment ──────────────────────────────────────────────────────
export interface EmailAttachment {
  name: string;
  contentType: string;
  data: string; // base64 encoded
  size?: string; // human-readable e.g. "1.2 MB"
}

// ─── Email ─────────────────────────────────────────────────────────────────
export interface Email {
  id: string;
  to: string;
  subject: string;
  body: string;
  senderId: string;
  sender: Sender;
  status: EmailStatus;
  scheduledAt: string;
  nextAttemptAt: string | null;
  sentAt: string | null;
  bullJobId: string | null;
  failureReason: string | null;
  previewUrl?: string | null;
  attachments?: EmailAttachment[] | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Search Result ─────────────────────────────────────────────────────────
export interface EmailSearchResult {
  id: string;
  score: number;
  to: string;
  subject: string;
  body: string;
  status: string;
  senderId: string;
  scheduledAt: string | null;
  sentAt: string | null;
  previewUrl?: string | null;
}

// ─── API Request Shapes ────────────────────────────────────────────────────
export interface ScheduleEmailPayload {
  to: string;
  subject: string;
  body: string;
  senderId: string;
  scheduledAt: string; // ISO 8601 date string
  attachments?: EmailAttachment[];
}

export interface CreateSenderPayload {
  name: string;
  email: string;
  maxEmailsPerHour?: number;
}

// ─── API Response Shapes ───────────────────────────────────────────────────
export interface ScheduleEmailResponse {
  email: Email;
}

export interface GetEmailsResponse {
  emails: Email[];
}

export interface SearchEmailsResponse {
  results: EmailSearchResult[];
}

export interface GetSendersResponse {
  senders: Sender[];
}

export interface CreateSenderResponse {
  sender: Sender;
}

// ─── Auth ──────────────────────────────────────────────────────────────────
// Shape returned by GET /api/auth/me → { user: SessionUser }
// This matches the Passport serialized user in backend/src/config/passport.ts
export interface SessionUser {
  id: string;    // Google profile ID
  name: string;
  email: string;
  avatar: string; // Google profile photo URL
}

export interface AuthState {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean; // true while /api/auth/me is in-flight
}

// ─── Slack ─────────────────────────────────────────────────────────────────
export interface SlackStatus {
  connected: boolean;
  teamId?: string;
  channelId?: string;
}

// ─── API Error ─────────────────────────────────────────────────────────────
export interface ApiError {
  error: string | Record<string, unknown>;
}
