import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/Avatar';
import Button from '../../components/Button';

// ─── Slack connect status ────────────────────────────────────────────────────
// TODO: backend endpoint for Slack OAuth not found — confirm with backend dev.
// The backend has a SlackConnection Prisma model but NO /auth/slack route,
// no Slack OAuth callback endpoint, and no Slack client credentials in the
// env config. The "Connect Slack" button is rendered as a disabled placeholder
// until the backend implements the OAuth flow. See NOTES.md for details.

const SLACK_CONNECTED = false; // TODO: replace with real API check once endpoint exists

export default function Header({
  onCompose,
}: {
  onCompose: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    toast.success('Signed out successfully.');
    navigate('/login', { replace: true });
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

          {/* Slack connect */}
          <div title="Slack OAuth not yet implemented in backend. See NOTES.md.">
            {SLACK_CONNECTED ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                {/* Slack logo mark */}
                <SlackIcon className="w-3.5 h-3.5" />
                Slack connected
              </span>
            ) : (
              <Button
                id="connect-slack-btn"
                variant="secondary"
                size="sm"
                disabled
                title="Slack OAuth endpoint not yet available in backend"
                leftIcon={<SlackIcon className="w-3.5 h-3.5 opacity-50" />}
              >
                Connect Slack
              </Button>
            )}
          </div>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10" />

          {/* User info */}
          <div className="flex items-center gap-2.5">
            <Avatar
              src={user?.picture}
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
