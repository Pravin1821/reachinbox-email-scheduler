import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';
import { getSlackStatus, disconnectSlack } from '../../api/slack';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

export default function Header({
  onCompose,
}: {
  onCompose: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // ─── Slack connection state ──────────────────────────────────────────────
  const [slackConnected, setSlackConnected] = useState(false);
  const [slackLoading, setSlackLoading] = useState(true);

  const loadSlackStatus = useCallback(async () => {
    setSlackLoading(true);
    try {
      const status = await getSlackStatus();
      setSlackConnected(status.connected);
    } catch {
      // Not connected or auth error — treat as disconnected
      setSlackConnected(false);
    } finally {
      setSlackLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlackStatus();
  }, [loadSlackStatus]);

  // ─── Handlers ───────────────────────────────────────────────────────────
  async function handleLogout() {
    await logout();
    toast.success('Signed out successfully.');
    navigate('/login', { replace: true });
  }

  function handleConnectSlack() {
    // Full-page redirect to backend Slack OAuth flow.
    // The backend /api/slack/connect redirects to Slack's OAuth page.
    // After approval, Slack redirects to /api/slack/callback which stores
    // the connection and redirects back to /dashboard?slack=connected.
    window.location.href = `${API_BASE}/api/slack/connect`;
  }

  async function handleDisconnectSlack() {
    try {
      await disconnectSlack();
      setSlackConnected(false);
      toast.success('Slack disconnected.');
    } catch {
      toast.error('Failed to disconnect Slack.');
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-surface/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mr-auto">
          <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow-sm flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-lg font-bold gradient-text">ReachInbox</span>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Compose button */}
          <Button
            id="compose-btn"
            variant="primary"
            size="sm"
            onClick={onCompose}
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Compose
          </Button>

          {/* Slack connect / status */}
          {slackLoading ? (
            <div className="w-[110px] h-8 rounded-lg bg-white/5 animate-pulse" />
          ) : slackConnected ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <SlackIcon className="w-3.5 h-3.5" />
                Slack connected
              </span>
              <button
                id="disconnect-slack-btn"
                onClick={handleDisconnectSlack}
                title="Disconnect Slack"
                className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <Button
              id="connect-slack-btn"
              variant="secondary"
              size="sm"
              onClick={handleConnectSlack}
              leftIcon={<SlackIcon className="w-3.5 h-3.5" />}
            >
              Connect Slack
            </Button>
          )}

          {/* Divider */}
          <div className="w-px h-6 bg-white/10" />

          {/* User info */}
          <div className="flex items-center gap-2.5">
            <Avatar
              src={user?.avatar}
              name={user?.name}
              size="sm"
            />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-sm font-medium text-white/90 truncate max-w-[120px]">
                {user?.name}
              </span>
              <span className="text-xs text-white/40 truncate max-w-[120px]">
                {user?.email}
              </span>
            </div>
          </div>

          {/* Logout */}
          <Button
            id="logout-btn"
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            title="Sign out"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </Button>
        </div>
      </div>
    </header>
  );
}

// Inline Slack SVG icon
function SlackIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 15a2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2h2v2zm1 0a2 2 0 012-2 2 2 0 012 2v5a2 2 0 01-2 2 2 2 0 01-2-2v-5zm2-9a2 2 0 01-2-2 2 2 0 012-2 2 2 0 012 2v2H9zm0 1a2 2 0 012 2 2 2 0 01-2 2H4a2 2 0 01-2-2 2 2 0 012-2h5zm9 2a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2V9h2zm-1 0a2 2 0 01-2-2 2 2 0 012-2 2 2 0 012 2v5a2 2 0 01-2 2 2 2 0 01-2-2v-5zm-9 9a2 2 0 012-2 2 2 0 012 2 2 2 0 01-2 2H9v-2zm0-1a2 2 0 01-2-2 2 2 0 012-2h5a2 2 0 012 2 2 2 0 01-2 2h-5z" />
    </svg>
  );
}
