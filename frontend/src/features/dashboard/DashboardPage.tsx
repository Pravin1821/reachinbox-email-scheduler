import { useState } from 'react';
import Header from './Header';
import Tabs from '../../components/Tabs';
import ScheduledEmailsTab from '../scheduled-emails/ScheduledEmailsTab';
import SentEmailsTab from '../sent-emails/SentEmailsTab';
import ComposeModal from '../compose/ComposeModal';

type TabId = 'scheduled' | 'sent';

const TABS = [
  {
    id: 'scheduled' as TabId,
    label: 'Scheduled Emails',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'sent' as TabId,
    label: 'Sent Emails',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabId>('scheduled');
  const [composeOpen, setComposeOpen] = useState(false);
  // Incrementing this triggers a refresh in the ScheduledEmailsTab
  const [scheduledRefreshToken, setScheduledRefreshToken] = useState(0);

  function handleScheduled() {
    setScheduledRefreshToken((n) => n + 1);
    setActiveTab('scheduled');
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Header onCompose={() => setComposeOpen(true)} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Email Dashboard</h1>
          <p className="text-white/40 text-sm">
            Manage your scheduled and sent email campaigns.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Scheduled"
            icon="🗓️"
            color="text-blue-400"
            bg="bg-blue-500/10"
            border="border-blue-500/20"
          />
          <StatCard
            label="Sent"
            icon="✅"
            color="text-emerald-400"
            bg="bg-emerald-500/10"
            border="border-emerald-500/20"
          />
          <StatCard
            label="Failed"
            icon="⚠️"
            color="text-red-400"
            bg="bg-red-500/10"
            border="border-red-500/20"
          />
        </div>

        {/* Tabs + content */}
        <div className="glass-card p-6 border border-white/5">
          <div className="flex items-center justify-between mb-6">
            <Tabs
              tabs={TABS}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as TabId)}
            />
          </div>

          <div className="animate-fade-in" key={activeTab}>
            {activeTab === 'scheduled' ? (
              <ScheduledEmailsTab refreshToken={scheduledRefreshToken} />
            ) : (
              <SentEmailsTab />
            )}
          </div>
        </div>
      </main>

      {/* Compose modal */}
      <ComposeModal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        onScheduled={handleScheduled}
      />
    </div>
  );
}

// ── Placeholder stat card ─────────────────────────────────────────────────
function StatCard({
  label,
  icon,
  color,
  bg,
  border,
}: {
  label: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div className={`glass-card p-4 border ${border} flex items-center gap-3`}>
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center text-lg`}>
        {icon}
      </div>
      <div>
        <p className={`text-sm font-semibold ${color}`}>{label}</p>
        <p className="text-xs text-white/30">Emails</p>
      </div>
    </div>
  );
}
