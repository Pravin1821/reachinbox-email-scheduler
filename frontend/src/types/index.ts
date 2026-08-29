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
}

// ─── API Request Shapes ────────────────────────────────────────────────────
export interface ScheduleEmailPayload {
  to: string;
  subject: string;
  body: string;
  senderId: string;
  scheduledAt: string; // ISO 8601 date string
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

// ─── Auth ──────────────────────────────────────────────────────────────────
export interface GoogleUser {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
}

export interface AuthState {
  user: GoogleUser | null;
  credential: string | null;
  isAuthenticated: boolean;
}

// ─── API Error ─────────────────────────────────────────────────────────────
export interface ApiError {
  error: string | Record<string, unknown>;
}
