import { useState, useRef, useCallback, type ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Spinner from '../../components/Spinner';
import { scheduleEmail } from '../../api/emails';
import { getSenders } from '../../api/senders';
import type { Sender } from '../../types';

// ─── CSV parsing ─────────────────────────────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ParseResult {
  valid: string[];
  invalid: number;
}

function parseLeads(raw: string): ParseResult {
  const tokens = raw
    .split(/[\n,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const valid: string[] = [];
  let invalid = 0;

  for (const token of tokens) {
    if (EMAIL_REGEX.test(token)) {
      valid.push(token);
    } else {
      invalid++;
    }
  }

  return { valid, invalid };
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduled: () => void; // callback to refresh Scheduled tab
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ComposeModal({ isOpen, onClose, onScheduled }: ComposeModalProps) {
  // Form state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [startTime, setStartTime] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(60);
  const [leads, setLeads] = useState<ParseResult>({ valid: [], invalid: 0 });
  const [rawLeads, setRawLeads] = useState('');
  const [csvFileName, setCsvFileName] = useState('');

  // Sender state
  // TODO: backend endpoint GET /api/senders not found — once implemented,
  // getSenders() will return the list and we populate the dropdown.
  const [senders, setSenders] = useState<Sender[]>([]);
  const [selectedSenderId, setSelectedSenderId] = useState('');
  const [senderError, setSenderError] = useState<string | null>(null);
  const [senderLoading, setSenderLoading] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load senders when modal opens ─────────────────────────────────────────
  const loadSenders = useCallback(async () => {
    setSenderLoading(true);
    setSenderError(null);
    try {
      const data = await getSenders();
      setSenders(data.senders);
      if (data.senders.length > 0) setSelectedSenderId(data.senders[0].id);
    } catch (err: unknown) {
      // TODO: GET /api/senders not found in backend — see NOTES.md
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.includes('404') || msg.includes('Not Found') || msg.includes('Cannot GET')) {
        setSenderError(
          'GET /api/senders is not yet implemented in the backend. ' +
          'Please ask the backend developer to add this endpoint, or ' +
          'manually enter a Sender UUID below.',
        );
      } else {
        setSenderError(msg);
      }
    } finally {
      setSenderLoading(false);
    }
  }, []);

  // Reset + load senders on open
  const handleOpen = useCallback(() => {
    setSubject('');
    setBody('');
    setStartTime('');
    setDelaySeconds(60);
    setLeads({ valid: [], invalid: 0 });
    setRawLeads('');
    setCsvFileName('');
    setErrors({});
    setProgress(null);
    setSenders([]);
    setSelectedSenderId('');
    loadSenders();
  }, [loadSenders]);

  // Trigger reset when modal opens
  const prevOpen = useRef(false);
  if (isOpen && !prevOpen.current) {
    prevOpen.current = true;
    handleOpen();
  }
  if (!isOpen && prevOpen.current) {
    prevOpen.current = false;
  }

  // ── CSV / text file upload ────────────────────────────────────────────────
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? '';
      setRawLeads(text);
      setLeads(parseLeads(text));
    };
    reader.readAsText(file);
  }

  function handleRawLeadsChange(e: ChangeEvent<HTMLTextAreaElement>) {
    setRawLeads(e.target.value);
    setLeads(parseLeads(e.target.value));
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!subject.trim()) errs.subject = 'Subject is required.';
    if (!body.trim()) errs.body = 'Body is required.';
    if (leads.valid.length === 0) errs.leads = 'At least one valid email address is required.';
    if (!startTime) errs.startTime = 'Start time is required.';
    if (!selectedSenderId.trim()) errs.senderId = 'Sender ID is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit: schedule each lead one by one ─────────────────────────────────
  async function handleSubmit() {
    if (!validate()) return;

    setSubmitting(true);
    setProgress({ done: 0, total: leads.valid.length });

    const baseTime = new Date(startTime).getTime();
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < leads.valid.length; i++) {
      const scheduledAt = new Date(baseTime + i * delaySeconds * 1000).toISOString();
      try {
        await scheduleEmail({
          to: leads.valid[i],
          subject,
          body,
          senderId: selectedSenderId.trim(),
          scheduledAt,
        });
        successCount++;
      } catch (err: unknown) {
        failCount++;
        console.error(`Failed to schedule ${leads.valid[i]}:`, err);
      }
      setProgress({ done: i + 1, total: leads.valid.length });
    }

    setSubmitting(false);
    setProgress(null);

    if (failCount === 0) {
      toast.success(`${successCount} email(s) scheduled successfully!`);
      onClose();
      onScheduled();
    } else if (successCount > 0) {
      toast.success(`${successCount} scheduled, ${failCount} failed. Check console for details.`);
      onClose();
      onScheduled();
    } else {
      toast.error('All scheduling attempts failed. Check console for details.');
      // Keep modal open so user doesn't lose their input
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compose New Email Campaign"
      maxWidth="2xl"
      disableClose={submitting}
    >
      <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Subject */}
        <Input
          id="compose-subject"
          name="compose-subject"
          label="Subject *"
          type="text"
          placeholder="Your email subject line"
          value={subject}
          onChange={(e) => setSubject(e.currentTarget.value)}
          error={errors.subject}
        />

        {/* Body */}
        <Input
          as="textarea"
          id="compose-body"
          name="compose-body"
          label="Body *"
          placeholder="Write your email body here..."
          value={body}
          onChange={(e) => setBody((e as ChangeEvent<HTMLTextAreaElement>).currentTarget.value)}
          error={errors.body}
          rows={5}
        />

        {/* Leads input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-white/70">
            Recipients *{' '}
            <span className="text-white/30 font-normal">
              (paste emails or upload CSV/TXT)
            </span>
          </label>

          {/* File upload */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="upload-csv-btn"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-lg bg-surface-100 border border-white/10 text-white/60 hover:text-white hover:border-white/20 text-xs font-medium flex items-center gap-2 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload CSV / TXT
            </button>
            {csvFileName && (
              <span className="text-xs text-white/40 truncate max-w-[200px]">{csvFileName}</span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="hidden"
              id="csv-file-input"
            />
          </div>

          {/* Paste textarea */}
          <textarea
            id="leads-textarea"
            value={rawLeads}
            onChange={handleRawLeadsChange}
            placeholder="or paste emails here, one per line or comma-separated&#10;e.g. alice@example.com, bob@example.com"
            rows={4}
            className={`input-base resize-none ${errors.leads ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500' : ''}`}
          />

          {/* Live count */}
          <div className="flex items-center gap-3 text-xs">
            <span className={`font-medium ${leads.valid.length > 0 ? 'text-emerald-400' : 'text-white/30'}`}>
              ✓ {leads.valid.length} valid email{leads.valid.length !== 1 ? 's' : ''} detected
            </span>
            {leads.invalid > 0 && (
              <span className="text-orange-400">
                ⚠ {leads.invalid} malformed row{leads.invalid !== 1 ? 's' : ''} skipped
              </span>
            )}
          </div>
          {errors.leads && <p className="text-xs text-red-400">{errors.leads}</p>}
        </div>

        {/* Start time */}
        <Input
          id="compose-start-time"
          name="compose-start-time"
          label="Start Time *"
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.currentTarget.value)}
          error={errors.startTime}
          min={new Date().toISOString().slice(0, 16)}
        />

        {/* Delay between emails */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="compose-delay" className="text-sm font-medium text-white/70">
            Delay between emails
            <span className="ml-1 text-white/30 font-normal">(seconds)</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              id="compose-delay"
              type="number"
              min={0}
              max={86400}
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(Math.max(0, parseInt(e.target.value) || 0))}
              className="input-base w-32 text-center"
            />
            <span className="text-xs text-white/30">
              {leads.valid.length > 1
                ? `Last email at ${formatOffset(delaySeconds * (leads.valid.length - 1))} after start`
                : 'Delay only applies for multiple recipients'}
            </span>
          </div>
        </div>

        {/* Sender */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="compose-sender-id" className="text-sm font-medium text-white/70">
            Sender ID (UUID) *
          </label>

          {senderLoading && (
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Spinner size="sm" /> Loading senders…
            </div>
          )}

          {/* Missing endpoint warning */}
          {senderError && (
            <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 p-3 text-xs text-orange-300">
              <p className="font-semibold mb-1">⚠ Backend endpoint missing</p>
              <p className="text-orange-300/70">{senderError}</p>
              <p className="mt-2 text-orange-300/50">
                {/* TODO: backend endpoint GET /api/senders not found, confirm with backend dev */}
                Please enter the Sender UUID directly from your database.
              </p>
            </div>
          )}

          {/* Sender dropdown if loaded */}
          {!senderLoading && senders.length > 0 && (
            <select
              id="compose-sender-select"
              value={selectedSenderId}
              onChange={(e) => setSelectedSenderId(e.target.value)}
              className="input-base"
            >
              {senders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.email}
                </option>
              ))}
            </select>
          )}

          {/* Manual UUID fallback (always shown so user can override or enter manually) */}
          <input
            id="compose-sender-id"
            type="text"
            value={selectedSenderId}
            onChange={(e) => setSelectedSenderId(e.target.value)}
            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
            className={`input-base font-mono text-xs ${errors.senderId ? 'border-red-500/60 focus:border-red-500' : ''}`}
          />
          {errors.senderId && <p className="text-xs text-red-400">{errors.senderId}</p>}
          <p className="text-xs text-white/30">
            Hourly send limit is configured per sender in the backend (default: 200/hr).
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {submitting && progress && (
        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs text-white/50">
            <span>Scheduling emails…</span>
            <span>{progress.done} / {progress.total}</span>
          </div>
          <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-brand rounded-full transition-all duration-300"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
        <Button
          id="compose-cancel-btn"
          variant="ghost"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          id="compose-submit-btn"
          variant="primary"
          onClick={handleSubmit}
          loading={submitting}
          disabled={submitting || leads.valid.length === 0}
        >
          {submitting
            ? `Scheduling… (${progress?.done ?? 0}/${progress?.total ?? 0})`
            : `Schedule ${leads.valid.length > 0 ? `${leads.valid.length} Email${leads.valid.length > 1 ? 's' : ''}` : 'Email'}`}
        </Button>
      </div>
    </Modal>
  );
}

// ── Helper ──────────────────────────────────────────────────────────────────
function formatOffset(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  if (totalSeconds < 3600) return `${Math.round(totalSeconds / 60)}m`;
  return `${(totalSeconds / 3600).toFixed(1)}h`;
}
