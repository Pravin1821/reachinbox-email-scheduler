import { useState, useEffect, useCallback } from 'react';
import { Clock, Send, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSlackStatus, disconnectSlack } from '../../api/slack';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;

interface SidebarProps {
  activeTab: 'scheduled' | 'sent';
  onSelectTab: (tab: 'scheduled' | 'sent') => void;
  scheduledCount: number;
  sentCount: number;
  onCompose: () => void;
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  scheduledCount,
  sentCount,
  onCompose,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Slack Connection State
  const [slackConnected, setSlackConnected] = useState(false);

  const loadSlackStatus = useCallback(async () => {
    try {
      const status = await getSlackStatus();
      setSlackConnected(status.connected);
    } catch {
      setSlackConnected(false);
    }
  }, []);

  useEffect(() => {
    loadSlackStatus();
  }, [loadSlackStatus]);

  const handleConnectSlack = () => {
    window.location.href = `${API_BASE}/api/slack/connect`;
  };

  const handleDisconnectSlack = async () => {
    try {
      await disconnectSlack();
      setSlackConnected(false);
      toast.success('Slack disconnected.');
    } catch {
      toast.error('Failed to disconnect Slack.');
    }
  };

  return (
    <aside className="w-64 bg-white text-gray-900 flex flex-col h-full border-r border-gray-100 flex-shrink-0 select-none p-5 font-sans">
      {/* 1. Top Logo: bold blocky wordmark ONB */}
      <div className="mb-5 px-1">
        <span className="text-2xl font-black tracking-tight text-gray-900">
          ONB
        </span>
      </div>

      {/* 2. User Profile Row */}
      <div className="relative mb-6">
        <div
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 border border-gray-100 cursor-pointer transition-all"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                {user?.name?.[0] || 'O'}
              </div>
            )}
            <div className="flex flex-col truncate">
              <span className="text-sm font-bold text-gray-900 truncate leading-tight">
                {user?.name || 'Oliver Brown'}
              </span>
              <span className="text-xs text-gray-400 truncate leading-tight mt-0.5">
                {user?.email || 'oliver.brown@domain.io'}
              </span>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-150 flex-shrink-0 ml-1.5 ${
              showProfileMenu ? 'rotate-180' : ''
            }`}
          />
        </div>

        {/* Profile Dropdown Menu */}
        {showProfileMenu && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-2 animate-fade-in text-xs">
            <button
              type="button"
              onClick={() => {
                setShowProfileMenu(false);
                logout();
              }}
              className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 font-medium transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* 3. Compose Button: green outline pill */}
      <button
        type="button"
        onClick={onCompose}
        className="w-full py-2.5 px-4 rounded-full border border-green-600 text-green-600 bg-white hover:bg-green-50 font-semibold text-sm transition-colors shadow-xs mb-6 flex items-center justify-center cursor-pointer"
      >
        Compose
      </button>

      {/* 4. Section Label "CORE" */}
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2.5">
        CORE
      </div>

      {/* 5. Navigation Items */}
      <nav className="space-y-1.5">
        {/* Scheduled Nav Item */}
        <button
          type="button"
          onClick={() => onSelectTab('scheduled')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
            activeTab === 'scheduled'
              ? 'bg-green-50 text-green-600 font-bold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4" />
            <span>Scheduled</span>
          </div>
          <span
            className={`text-xs ${
              activeTab === 'scheduled' ? 'text-green-600 font-bold' : 'text-gray-400'
            }`}
          >
            {scheduledCount}
          </span>
        </button>

        {/* Sent Nav Item */}
        <button
          type="button"
          onClick={() => onSelectTab('sent')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer ${
            activeTab === 'sent'
              ? 'bg-green-50 text-green-600 font-bold'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium'
          }`}
        >
          <div className="flex items-center gap-3">
            <Send className="w-4 h-4" />
            <span>Sent</span>
          </div>
          <span
            className={`text-xs ${
              activeTab === 'sent' ? 'text-green-600 font-bold' : 'text-gray-400'
            }`}
          >
            {sentCount}
          </span>
        </button>
      </nav>

      {/* 6. Slack Connection Status at Bottom */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        {slackConnected ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 font-bold text-emerald-800 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Slack Connected
              </span>
              <button
                type="button"
                onClick={handleDisconnectSlack}
                className="text-gray-400 hover:text-red-600 text-[11px] font-semibold hover:underline cursor-pointer"
                title="Disconnect Slack"
              >
                Disconnect
              </button>
            </div>
            <p className="text-[11px] text-emerald-600 leading-tight">
              Real-time notifications enabled
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConnectSlack}
            className="w-full flex items-center justify-center gap-2.5 bg-[#4A154B] hover:bg-[#3d113e] text-white rounded-xl py-2.5 px-3 text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer group"
          >
            {/* Real Slack 4-color icon */}
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 122.8 122.8">
              <path
                d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z"
                fill="#E01E5A"
              />
              <path
                d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z"
                fill="#36C5F0"
              />
              <path
                d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z"
                fill="#2EB67D"
              />
              <path
                d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z"
                fill="#ECB22E"
              />
            </svg>
            <span>Connect Slack</span>
          </button>
        )}
      </div>
    </aside>
  );
}
