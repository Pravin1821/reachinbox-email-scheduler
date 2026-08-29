import { useState, useEffect, useRef, useCallback, type ChangeEvent } from 'react';
import { ArrowLeft, Paperclip, Clock, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import ChipInput from '../../components/ChipInput';
import RichTextEditor from '../../components/RichTextEditor';
import SendLaterPopover from '../../components/SendLaterPopover';
import { scheduleEmail } from '../../api/emails';
import { getSenders, createSender } from '../../api/senders';
import type { Sender, EmailAttachment } from '../../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ComposePageProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduled: () => void;
}

export default function ComposePage({
  isOpen,
  onClose,
  onScheduled,
}: ComposePageProps) {
  // Form state
  const [fromSenderId, setFromSenderId] = useState('');
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(0);
  const [hourlyLimit, setHourlyLimit] = useState(0);
  const [scheduledIsoTime, setScheduledIsoTime] = useState<string | null>(null);

  // Senders state
  const [senders, setSenders] = useState<Sender[]>([]);
  const [sendersLoading, setSendersLoading] = useState(false);
  const [showCreateSender, setShowCreateSender] = useState(false);
  const [newSenderName, setNewSenderName] = useState('');
  const [newSenderEmail, setNewSenderEmail] = useState('');

  // UI Popover & Upload state
  const [showSendLaterPopover, setShowSendLaterPopover] = useState(false);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const loadSenders = useCallback(async () => {
    setSendersLoading(true);
    try {
      const data = await getSenders();
      setSenders(data.senders);
      if (data.senders.length > 0) {
        setFromSenderId(data.senders[0].id);
        setHourlyLimit(data.senders[0].maxEmailsPerHour || 200);
      }
    } catch {
      // ignore
    } finally {
      setSendersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadSenders();
    }
  }, [isOpen, loadSenders]);

  if (!isOpen) return null;

  const handleCreateSender = async () => {
    if (!newSenderName.trim() || !newSenderEmail.trim()) {
      toast.error('Sender name and email are required');
      return;
    }
    try {
      const { sender } = await createSender({
        name: newSenderName.trim(),
        email: newSenderEmail.trim(),
      });
      setSenders((prev) => [...prev, sender]);
      setFromSenderId(sender.id);
      setShowCreateSender(false);
      setNewSenderName('');
      setNewSenderEmail('');
      toast.success('Sender created successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create sender');
    }
  };

  // CSV List Upload Handler
  const handleCsvUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) || '';
      const tokens = text.split(/[\n,;]+/).map((t) => t.trim()).filter(Boolean);
      const valid = tokens.filter((t) => EMAIL_REGEX.test(t));
      if (valid.length > 0) {
        setToEmails((prev) => Array.from(new Set([...prev, ...valid])));
        toast.success(`Imported ${valid.length} recipient address(es)`);
      } else {
        toast.error('No valid email addresses found in file');
      }
    };
    reader.readAsText(file);
  };

  // File Attachment Upload Handler — converts to base64 for API transport
  const handleAttachmentUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1]; // strip data URL prefix
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            contentType: file.type || 'application/octet-stream',
            data: base64,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    // Reset input so the same file can be re-added if removed
    e.target.value = '';
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!fromSenderId) {
      toast.error('Please select or create a sender');
      return;
    }
    if (toEmails.length === 0) {
      toast.error('Please add at least one recipient');
      return;
    }
    if (!subject.trim()) {
      toast.error('Subject line is required');
      return;
    }

    setSubmitting(true);
    const baseTime = scheduledIsoTime
      ? new Date(scheduledIsoTime).getTime()
      : Date.now() + 5000; // Immediate sends schedule 5s out

    let successCount = 0;
    for (let i = 0; i < toEmails.length; i++) {
      const scheduledAt = new Date(baseTime + i * delaySeconds * 1000).toISOString();
      try {
        await scheduleEmail({
          to: toEmails[i],
          subject,
          body,
          senderId: fromSenderId,
          scheduledAt,
          attachments: attachments.length > 0 ? attachments : undefined,
        });
        successCount++;
      } catch (err) {
        console.error(err);
      }
    }

    setSubmitting(false);
    if (successCount > 0) {
      toast.success(`${successCount} email(s) scheduled successfully!`);
      onScheduled();
      onClose();
    } else {
      toast.error('Failed to schedule emails');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-full overflow-y-auto animate-fade-in font-sans">
      {/* Hidden File Inputs */}
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv,.txt"
        onChange={handleCsvUpload}
        className="hidden"
      />
      <input
        ref={attachmentInputRef}
        type="file"
        accept="*"
        multiple
        onChange={handleAttachmentUpload}
        className="hidden"
      />

      {/* 1. Top Header Bar */}
      <div className="p-4 sm:px-8 sm:py-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Compose New Email</h2>
        </div>

        {/* Right actions: Paperclip, Clock, Action Button */}
        <div className="flex items-center gap-3.5 relative">
          {/* Attachment Icon */}
          <button
            type="button"
            onClick={() => attachmentInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors relative cursor-pointer"
            title="Attach images"
          >
            <Paperclip className="w-4 h-4" />
            {attachments.length > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-green-600 text-white text-[9px] font-bold flex items-center justify-center">
                {attachments.length}
              </span>
            )}
          </button>

          {/* Clock Icon (Send Later Popover trigger) */}
          <button
            type="button"
            onClick={() => setShowSendLaterPopover(!showSendLaterPopover)}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              scheduledIsoTime
                ? 'text-green-600 bg-green-50'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Send Later"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Send Later Popover Component */}
          <SendLaterPopover
            isOpen={showSendLaterPopover}
            onClose={() => setShowSendLaterPopover(false)}
            onSelectTime={(isoTime) => setScheduledIsoTime(isoTime)}
          />

          {/* Main Action Button: Green pill button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="py-2 px-6 rounded-full bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            {submitting
              ? scheduledIsoTime
                ? 'Scheduling...'
                : 'Sending...'
              : scheduledIsoTime
              ? 'Send Later'
              : 'Send'}
          </button>
        </div>
      </div>

      {/* 2. Main Form Fields */}
      <div className="max-w-5xl mx-auto w-full p-6 sm:p-8 space-y-5 flex-1">
        {/* From Field */}
        <div className="flex items-center border-b border-gray-200 py-3">
          <span className="w-20 text-sm font-semibold text-gray-500">From</span>
          {sendersLoading ? (
            <span className="text-sm text-gray-400">Loading senders...</span>
          ) : senders.length > 0 ? (
            <div className="relative inline-flex items-center">
              <select
                value={fromSenderId}
                onChange={(e) => {
                  setFromSenderId(e.target.value);
                  const s = senders.find((item) => item.id === e.target.value);
                  if (s) setHourlyLimit(s.maxEmailsPerHour);
                }}
                className="appearance-none bg-gray-50 border border-gray-200/80 rounded-lg pl-3.5 pr-9 py-2 text-sm text-gray-800 outline-none font-medium cursor-pointer"
              >
                {senders.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.email}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 pointer-events-none" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">No senders found</span>
              <button
                type="button"
                onClick={() => setShowCreateSender(true)}
                className="text-sm font-bold text-green-600 hover:underline cursor-pointer"
              >
                + Create Sender
              </button>
            </div>
          )}
        </div>

        {/* Inline Create Sender modal/form */}
        {showCreateSender && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Sender Name"
                value={newSenderName}
                onChange={(e) => setNewSenderName(e.target.value)}
                className="p-2.5 border rounded-lg bg-white outline-none text-sm"
              />
              <input
                type="email"
                placeholder="Sender Email"
                value={newSenderEmail}
                onChange={(e) => setNewSenderEmail(e.target.value)}
                className="p-2.5 border rounded-lg bg-white outline-none text-sm"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCreateSender(false)}
                className="px-3.5 py-1.5 text-gray-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSender}
                className="px-4 py-1.5 bg-green-600 text-white rounded-lg font-bold cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* To Field */}
        <div className="flex items-start">
          <span className="w-20 text-sm font-semibold text-gray-500 pt-3.5">To</span>
          <div className="flex-1">
            <ChipInput
              value={toEmails}
              onChange={setToEmails}
              placeholder="recipient@example.com"
              onUploadClick={() => csvInputRef.current?.click()}
            />
          </div>
        </div>

        {/* Subject Field */}
        <div className="flex items-center border-b border-gray-200 py-3">
          <span className="w-20 text-sm font-semibold text-gray-500">Subject</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
          />
        </div>

        {/* Delay & Hourly Limit Row */}
        <div className="flex items-center gap-8 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-gray-500">
              Delay between 2 emails
            </span>
            <input
              type="number"
              min={0}
              placeholder="00"
              value={delaySeconds === 0 ? '' : delaySeconds}
              onChange={(e) => setDelaySeconds(parseInt(e.target.value) || 0)}
              className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-center text-gray-800 outline-none"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-gray-500">Hourly Limit</span>
            <input
              type="number"
              min={1}
              placeholder="00"
              value={hourlyLimit === 0 ? '' : hourlyLimit}
              onChange={(e) => setHourlyLimit(parseInt(e.target.value) || 200)}
              className="w-20 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-center text-gray-800 outline-none"
            />
          </div>
        </div>

        {/* Rich Text Editor */}
        <div className="pt-2">
          <RichTextEditor
            value={body}
            onChange={setBody}
            placeholder="Type Your Reply..."
          />
        </div>

        {/* Attachment Thumbnails / File List Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
            {attachments.map((att, idx) => {
              const isImage = att.contentType.startsWith('image/');
              const dataUrl = `data:${att.contentType};base64,${att.data}`;
              return (
                <div
                  key={idx}
                  className="relative group w-36 rounded-xl border border-gray-200 bg-white overflow-hidden text-xs shadow-sm"
                >
                  {isImage ? (
                    <img
                      src={dataUrl}
                      alt={att.name}
                      className="w-full h-28 object-cover"
                    />
                  ) : (
                    <div className="w-full h-28 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-[10px] text-gray-400 px-2 text-center truncate w-full">{att.contentType}</span>
                    </div>
                  )}
                  <div className="p-2.5">
                    <p className="font-bold text-gray-800 truncate">{att.name}</p>
                    <p className="text-gray-400">{att.size}</p>
                  </div>
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
