import { ArrowLeft, Star, Archive, Trash2, ChevronDown, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type { Email } from '../../types';

interface EmailDetailViewProps {
  email: Email;
  onBack: () => void;
}

export default function EmailDetailView({
  email,
  onBack,
}: EmailDetailViewProps) {
  const { user } = useAuth();

  const formattedDate = () => {
    try {
      const d = new Date(email.scheduledAt || email.sentAt || email.createdAt);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return '';
    }
  };

  const senderName = email.sender?.name || 'Amanda Clark';
  const senderEmail = email.sender?.email || 'sender@example.com';
  const initial = senderName[0]?.toUpperCase() || 'A';

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-y-auto min-w-0 font-sans">
      {/* 1. Top Bar: Back arrow, Subject title, and top-right action icons */}
      <div className="p-4 sm:px-8 sm:py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 cursor-pointer"
            title="Back to list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
            {email.subject || '(No Subject)'}
          </h2>
        </div>

        {/* Top right: Star, Archive, Trash, User Avatar evenly spaced */}
        <div className="flex items-center gap-3.5 flex-shrink-0">
          {/* Ethereal preview link if available */}
          {email.previewUrl && (
            <a
              href={email.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-all shadow-xs"
              title="Open message in Ethereal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Sent Email
            </a>
          )}

          <button
            type="button"
            className="p-2 text-gray-400 hover:text-amber-500 transition-colors cursor-pointer"
            title="Star"
          >
            <Star className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            title="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
            title="Trash"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* User Avatar */}
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ml-1"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs ml-1">
              {user?.name?.[0] || 'O'}
            </div>
          )}
        </div>
      </div>

      {/* 2. Sender Row */}
      <div className="p-6 sm:p-8 max-w-5xl">
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-3.5">
            {/* Colored circular avatar with sender's first initial */}
            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-900">
                  {senderName}
                </span>
                <span className="text-sm text-gray-400">
                  &lt;{senderEmail}&gt;
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <span>to me</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-gray-400 font-medium">
              {formattedDate()}
            </span>
            {email.status && (
              <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                {email.status}
              </span>
            )}
          </div>
        </div>

        {/* 3. Body Content: Plain email content with normal line height */}
        <div className="text-base text-gray-800 leading-relaxed space-y-4 mb-8">
          <div
            dangerouslySetInnerHTML={{ __html: email.body }}
            className="prose max-w-none text-gray-800"
          />
        </div>
      </div>
    </div>
  );
}
