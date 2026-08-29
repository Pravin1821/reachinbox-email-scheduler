import { useState, useRef, useCallback, type ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Spinner from '../../components/Spinner';
import { scheduleEmail } from '../../api/emails';
import { getSenders, createSender } from '../../api/senders';
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
  const [senders, setSenders] = useState<Sender[]>([]);
  const [selectedSenderId, setSelectedSenderId] = useState('');
  const [senderError, setSenderError] = useState<string | null>(null);
  const [senderLoading, setSenderLoading] = useState(false);

  // Inline "create sender" form
  const [showCreateSender, setShowCreateSender] = useState(false);
  const [newSenderName, setNewSenderName] = useState('');
  const [newSenderEmail, setNewSenderEmail] = useState('');
  const [newSenderLimit, setNewSenderLimit] = useState(200);
  const [creatingsSender, setCreatingSender] = useState(false);

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
      if (data.senders.length > 0) {
        setSelectedSenderId(data.senders[0].id);
        setShowCreateSender(false);
      } else {
        setSelectedSenderId('');
        setShowCreateSender(false); // show the "no senders" prompt instead
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setSenderError(msg);
    } finally {
      setSenderLoading(false);
    }
  }, []);

  // ── Create a new sender inline ─────────────────────────────────────────────
  async function handleCreateSender() {
    if (!newSenderName.trim() || !newSenderEmail.trim()) {
      toast.error('Name and email are required to create a sender.');
      return;
    }
    setCreatingSender(true);
    try {
      const { sender } = await createSender({
        name: newSenderName.trim(),
        email: newSenderEmail.trim(),
        maxEmailsPerHour: newSenderLimit,
      });
      setSenders((prev) => [...prev, sender]);
      setSelectedSenderId(sender.id);
      setShowCreateSender(false);
      setNewSenderName('');
      setNewSenderEmail('');
      setNewSenderLimit(200);
      toast.success(`Sender "${sender.name}" created!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create sender.';
      toast.error(msg);
    } finally {
      setCreatingSender(false);
    }
  }

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
    setShowCreateSender(false);
    setNewSenderName('');
    setNewSenderEmail('');
    setNewSenderLimit(200);
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
    if (!selectedSenderId.trim()) errs.senderId = 'Please select or create a sender.';
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
            placeholder={"or paste emails here, one per line or comma-separated\ne.g. alice@example.com, bob@example.com"}
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

        {/* Sender selection */}
        <div className="flex flex-col gap-2">
          <label htmlFor="compose-sender-select" className="text-sm font-medium text-white/70">
            From Sender *
          </label>

          {senderLoading && (
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Spinner size="sm" /> Loading senders…
            </div>
          )}

          {senderError && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
              <p className="font-semibold mb-1">⚠ Failed to load senders</p>
              <p className="text-red-300/70">{senderError}</p>
            </div>
          )}

          {/* Sender dropdown */}
          {!senderLoading && senders.length > 0 && (
            <select
              id="compose-sender-select"
              value={selectedSenderId}
              onChange={(e) => setSelectedSenderId(e.target.value)}
              className="input-base"
            >
              {senders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.email} (limit: {s.maxEmailsPerHour}/hr)
                </option>
              ))}
            </select>
          )}

          {/* No senders prompt */}
          {!senderLoading && !senderError && senders.length === 0 && !showCreateSender && (
            <div className="rounded-lg bg-brand-500/10 border border-brand-500/20 p-4 text-sm">
              <p className="text-white/70 mb-3">
                No senders found. Create one to get started.
              </p>
              <Button
                id="create-sender-prompt-btn"
                variant="secondary"
                size="sm"
                onClick={() => setShowCreateSender(true)}
                leftIcon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Create Sender
              </Button>
            </div>
          )}

          {/* Inline create sender form */}
          {showCreateSender && (
            <div className="rounded-lg bg-surface-100 border border-white/10 p-4 space-y-3">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">New Sender</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/50">Display Name *</label>
                  <input
                    id="new-sender-name"
                    type="text"
                    value={newSenderName}
                    onChange={(e) => setNewSenderName(e.target.value)}
                    placeholder="Acme Marketing"
                    className="input-base text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/50">From Email *</label>
                  <input
                    id="new-sender-email"
                    type="email"
                    value={newSenderEmail}
                    onChange={(e) => setNewSenderEmail(e.target.value)}
                    placeholder="hello@acme.com"
                    className="input-base text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-white/50">Max emails / hour</label>
                <input
                  id="new-sender-limit"
                  type="number"
                  min={1}
                  max={10000}
                  value={newSenderLimit}
                  onChange={(e) => setNewSenderLimit(Math.max(1, parseInt(e.target.value) || 200))}
                  className="input-base w-32 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  id="create-sender-submit-btn"
                  variant="primary"
                  size="sm"
                  onClick={handleCreateSender}
                  loading={creatingsSender}
                  disabled={creatingsSender}
                >
                  Create Sender
                </Button>
                <Button
                  id="create-sender-cancel-btn"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateSender(false)}
                  disabled={creatingsSender}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* "Add another sender" link when senders already exist */}
          {!senderLoading && senders.length > 0 && !showCreateSender && (
            <button
              type="button"
              id="add-another-sender-btn"
              onClick={() => setShowCreateSender(true)}
              className="text-xs text-brand-400/70 hover:text-brand-400 self-start transition-colors"
            >
              + Add another sender
            </button>
          )}

          {errors.senderId && <p className="text-xs text-red-400">{errors.senderId}</p>}
          <p className="text-xs text-white/30">
            Hourly send limit is configured per sender (enforced by Redis atomic rate limiter).
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
