import { useState, useEffect, useCallback } from 'react';
import Input from '../../components/Input';
import Table, { type Column } from '../../components/Table';
import Badge from '../../components/Badge';
import { getScheduledEmails, searchEmails } from '../../api/emails';
import { useDebounce } from '../../hooks/useDebounce';
import type { Email } from '../../types';

const columns: Column<Email>[] = [
  {
    key: 'to',
    header: 'Recipient',
    render: (row) => (
      <span className="font-medium text-white/90">{row.to}</span>
    ),
  },
  {
    key: 'subject',
    header: 'Subject',
    render: (row) => (
      <span className="text-white/70 truncate block max-w-[240px]" title={row.subject}>
        {row.subject}
      </span>
    ),
  },
  {
    key: 'scheduledAt',
    header: 'Scheduled At',
    render: (row) => (
      <span className="text-white/50 text-xs font-mono whitespace-nowrap">
        {formatDateTime(row.scheduledAt)}
      </span>
    ),
    width: '180px',
  },
  {
    key: 'sender',
    header: 'Sender',
    render: (row) => (
      <span className="text-white/50 text-xs truncate block max-w-[140px]" title={row.sender?.email}>
        {row.sender?.name ?? row.senderId}
      </span>
    ),
    width: '160px',
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <Badge status={row.status} />,
    width: '140px',
  },
];

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

interface ScheduledEmailsTabProps {
  /** Increment to trigger a refresh from parent */
  refreshToken: number;
}

export default function ScheduledEmailsTab({ refreshToken }: ScheduledEmailsTabProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<Email[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // ── Load scheduled emails ──────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getScheduledEmails();
      setEmails(data.emails);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load scheduled emails.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshToken]);

  // ── Elasticsearch search (debounced) ──────────────────────────────────
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    searchEmails(debouncedQuery)
      .then((data) => {
        // Filter search results to only show scheduled-type emails
        const filtered = data.results.filter((r) =>
          ['SCHEDULED', 'QUEUED', 'RATE_LIMITED'].includes(r.status),
        );
        // Map SearchResult back to Email shape for the table (partial — missing sender object)
        setSearchResults(
          filtered.map((r) => ({
            id: r.id,
            to: r.to,
            subject: r.subject,
            body: r.body,
            senderId: r.senderId,
            sender: { id: r.senderId, name: '', email: '', maxEmailsPerHour: 0, createdAt: '' },
            status: r.status as Email['status'],
            scheduledAt: r.scheduledAt ?? '',
            nextAttemptAt: null,
            sentAt: r.sentAt,
            bullJobId: null,
            failureReason: null,
            createdAt: '',
            updatedAt: '',
          })),
        );
      })
      .catch((err: unknown) => {
        console.error('Search error:', err);
        setSearchResults(null);
      })
      .finally(() => setSearchLoading(false));
  }, [debouncedQuery]);

  const displayData = searchResults ?? emails;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Input
            id="scheduled-search"
            name="scheduled-search"
            type="text"
            placeholder="Search by recipient, subject, or body…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            leftIcon={
              searchLoading ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )
            }
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Clear
          </button>
        )}
        <span className="text-xs text-white/30 whitespace-nowrap">
          {displayData.length} result{displayData.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <Table
        columns={columns}
        data={displayData}
        loading={loading}
        error={error}
        onRetry={load}
        emptyTitle="No scheduled emails yet"
        emptyDescription="Click 'Compose' to schedule your first email campaign."
        keyExtractor={(row) => row.id}
      />
    </div>
  );
}
