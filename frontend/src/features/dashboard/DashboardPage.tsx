import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import EmailListView from './EmailListView';
import EmailDetailView from './EmailDetailView';
import ComposePage from '../compose/ComposePage';
import { getScheduledEmails, getSentEmails, searchEmails } from '../../api/emails';
import type { Email } from '../../types';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);

  // Counts for Sidebar
  const [scheduledCount, setScheduledCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  // Selected Email for Detail View
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  // Compose Overlay State
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const fetchEmailData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch both scheduled & sent emails in parallel to keep sidebar counts updated
      const [scheduledRes, sentRes] = await Promise.all([
        getScheduledEmails(),
        getSentEmails(),
      ]);

      setScheduledCount(scheduledRes.emails.length);
      setSentCount(sentRes.emails.length);

      if (activeTab === 'scheduled') {
        setEmails(scheduledRes.emails);
      } else {
        setEmails(sentRes.emails);
      }
    } catch (err) {
      console.error('Failed to fetch emails:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

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
      // fallback
    } finally {
      setLoading(false);
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
        onCompose={() => setIsComposeOpen(true)}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 h-full bg-white overflow-hidden relative min-w-0">
        {selectedEmail ? (
          <EmailDetailView
            email={selectedEmail}
            onBack={() => setSelectedEmail(null)}
          />
        ) : (
          <EmailListView
            emails={emails}
            loading={loading}
            activeTab={activeTab}
            onSelectEmail={(email) => setSelectedEmail(email)}
            onRefresh={fetchEmailData}
            onSearch={handleSearch}
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
