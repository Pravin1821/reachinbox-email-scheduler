import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Sidebar from './Sidebar';
import EmailListView from './EmailListView';
import EmailDetailView from './EmailDetailView';
import ComposePage from '../compose/ComposePage';
import { getScheduledEmails, getSentEmails, searchEmails, deleteEmail } from '../../api/emails';
import type { Email } from '../../types';

// ── localStorage helpers ─────────────────────────────────────────────────────
function loadSet(key: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); }
}
function saveSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent' | 'archived'>('scheduled');
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  // Counts for Sidebar
  const [scheduledCount, setScheduledCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);

  // Selected Email for Detail View
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  // Compose Overlay State
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // ── Starred & Archived (localStorage-persisted) ──────────────────────────
  const [starredIds, setStarredIds] = useState<Set<string>>(() => loadSet('ri_starred'));
  const [archivedIds, setArchivedIds] = useState<Set<string>>(() => loadSet('ri_archived'));

  const toggleStar = (id: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveSet('ri_starred', next);
      return next;
    });
  };

  const toggleArchive = (id: string) => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      saveSet('ri_archived', next);
      return next;
    });
    // Navigate back from detail if currently viewing the archived email
    setSelectedEmail((sel) => (sel?.id === id ? null : sel));
  };

  const fetchEmailData = useCallback(async () => {
    setLoading(true);
    try {
      const [scheduledRes, sentRes] = await Promise.all([
        getScheduledEmails(),
        getSentEmails(),
      ]);

      // Exclude archived emails from scheduled & sent lists
      const notArchived = (e: Email) => !archivedIds.has(e.id);
      const isArchived = (e: Email) => archivedIds.has(e.id);

      setScheduledCount(scheduledRes.emails.filter(notArchived).length);
      setSentCount(sentRes.emails.filter(notArchived).length);

      const allEmails = [...scheduledRes.emails, ...sentRes.emails];
      setArchivedCount(allEmails.filter(isArchived).length);

      if (activeTab === 'scheduled') {
        setEmails(scheduledRes.emails.filter(notArchived));
      } else if (activeTab === 'sent') {
        setEmails(sentRes.emails.filter(notArchived));
      } else {
        setEmails(allEmails.filter(isArchived));
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, archivedIds]);

  useEffect(() => {
    fetchEmailData();
  }, [fetchEmailData]);

  // Handle Search
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      fetchEmailData();
      return;
    }
    setLoading(true);
    try {
      const res = await searchEmails(query);
      // Map search results to Email shapes
      const mapped: Email[] = res.results.map((r) => ({
        id: r.id,
        to: r.to,
        subject: r.subject,
        body: r.body,
        status: r.status as Email['status'],
        scheduledAt: r.scheduledAt || new Date().toISOString(),
        senderId: r.senderId,
        sender: { id: r.senderId, name: 'Sender', email: 'sender@example.com', maxEmailsPerHour: 200, createdAt: '' },
        nextAttemptAt: null,
        sentAt: r.sentAt,
        previewUrl: r.previewUrl,
        bullJobId: null,
        failureReason: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      setEmails(mapped);
    } catch {
      toast.error('Search failed — please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (emailId: string) => {
    try {
      await deleteEmail(emailId);
      toast.success('Email deleted.');
      setSelectedEmail(null);
      fetchEmailData();
    } catch {
      toast.error('Failed to delete email.');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white font-sans">
      {/* 1. Fixed Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSelectedEmail(null); // Reset detail view when switching tabs
        }}
        scheduledCount={scheduledCount}
        sentCount={sentCount}
        archivedCount={archivedCount}
        onCompose={() => setIsComposeOpen(true)}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 h-full bg-white overflow-hidden relative min-w-0">
        {selectedEmail ? (
          <EmailDetailView
            email={selectedEmail}
            onBack={() => setSelectedEmail(null)}
            onDelete={handleDelete}
            isStarred={starredIds.has(selectedEmail.id)}
            onToggleStar={() => toggleStar(selectedEmail.id)}
            isArchived={archivedIds.has(selectedEmail.id)}
            onArchive={() => toggleArchive(selectedEmail.id)}
          />
        ) : (
          <EmailListView
            emails={emails}
            loading={loading}
            activeTab={activeTab}
            onSelectEmail={(email) => setSelectedEmail(email)}
            onRefresh={fetchEmailData}
            onSearch={handleSearch}
            starredIds={starredIds}
            onToggleStar={toggleStar}
          />
        )}
      </main>

      {/* 3. Compose Overlay */}
      <ComposePage
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onScheduled={fetchEmailData}
      />
    </div>
  );
}
