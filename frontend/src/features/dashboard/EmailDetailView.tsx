import { ArrowLeft, Star, Archive, Trash2, ChevronDown, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import type { Email } from '../../types';

interface EmailDetailViewProps {
  email: Email;
  onBack: () => void;
  onDelete: (id: string) => Promise<void>;
  isStarred: boolean;
  onToggleStar: () => void;
  isArchived: boolean;
  onArchive: () => void;
}

export default function EmailDetailView({
  email,
  onBack,
  onDelete,
  isStarred,
  onToggleStar,
  isArchived,
  onArchive,
}: EmailDetailViewProps) {
  const { user } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this email? This cannot be undone.')) return;
    setDeleting(true);
    await onDelete(email.id);
    setDeleting(false);
  };

  const handleArchive = () => {
    toast.success(isArchived ? 'Email unarchived.' : 'Email archived.');
    onArchive();
  };

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
            onClick={onToggleStar}
            className={`p-2 transition-colors cursor-pointer ${
              isStarred ? 'text-amber-400 hover:text-amber-500' : 'text-gray-400 hover:text-amber-500'
            }`}
            title={isStarred ? 'Unstar' : 'Star'}
          >
            <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleArchive}
            className={`p-2 transition-colors cursor-pointer rounded-lg ${
              isArchived
                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                : 'text-gray-400 hover:text-blue-500 hover:bg-gray-100'
            }`}
            title={isArchived ? 'Unarchive email' : 'Archive email'}
          >
            <Archive className={`w-4 h-4 ${isArchived ? 'text-blue-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-40"
            title="Delete"
          >
            <Trash2 className={`w-4 h-4 ${deleting ? 'animate-pulse' : ''}`} />
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

        {/* 3. Body Content */}
        <div className="text-base text-gray-800 leading-relaxed space-y-4 mb-8">
          <div
            dangerouslySetInnerHTML={{ __html: email.body }}
            className="prose max-w-none text-gray-800"
          />
        </div>

        {/* 4. Attachments */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="border-t border-gray-100 pt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              {email.attachments.length} Attachment{email.attachments.length !== 1 ? 's' : ''}
            </p>
            <div className="flex flex-wrap gap-3">
              {email.attachments.map((att, idx) => {
                const isImage = att.contentType.startsWith('image/');
                const dataUrl = `data:${att.contentType};base64,${att.data}`;
                return (
                  <a
                    key={idx}
                    href={dataUrl}
                    download={att.name}
                    title={`Download ${att.name}`}
                    className="group w-40 rounded-xl border border-gray-200 bg-white overflow-hidden text-xs shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
                  >
                    {isImage ? (
                      <img
                        src={dataUrl}
                        alt={att.name}
                        className="w-full h-28 object-cover group-hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-28 bg-gray-50 flex flex-col items-center justify-center text-gray-400 group-hover:bg-gray-100 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9 mb-1.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-[10px] text-gray-400 px-2 text-center truncate w-full">{att.contentType}</span>
                      </div>
                    )}
                    <div className="p-2.5 border-t border-gray-100">
                      <p className="font-semibold text-gray-800 truncate">{att.name}</p>
                      {att.size && <p className="text-gray-400 mt-0.5">{att.size}</p>}
                      <p className="text-green-600 font-medium mt-1 flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
