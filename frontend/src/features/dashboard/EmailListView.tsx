import { useState, useMemo, useRef, useEffect, type ChangeEvent } from 'react';
import { Search, SlidersHorizontal, RotateCw, Clock, Star, ExternalLink, Check } from 'lucide-react';
import type { Email } from '../../types';

interface EmailListViewProps {
  emails: Email[];
  loading: boolean;
  activeTab: 'scheduled' | 'sent';
  onSelectEmail: (email: Email) => void;
  onRefresh: () => void;
  onSearch: (query: string) => void;
}

export default function EmailListView({
  emails,
  loading,
  activeTab,
  onSelectEmail,
  onRefresh,
  onSearch,
}: EmailListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'SENT' | 'FAILED' | 'RATE_LIMITED'>('ALL');
  const [starredOnly, setStarredOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());

  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    onSearch(q);
  };

  const toggleStar = (emailId: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(emailId)) {
        next.delete(emailId);
      } else {
        next.add(emailId);
      }
      return next;
    });
  };

  const hasActiveFilters = statusFilter !== 'ALL' || starredOnly || sortBy !== 'newest';

  const resetFilters = () => {
    setStatusFilter('ALL');
    setStarredOnly(false);
    setSortBy('newest');
  };

  // Filtered and sorted list of emails
  const displayEmails = useMemo(() => {
    let result = [...emails];

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter((e) => {
        if (statusFilter === 'SCHEDULED') return e.status === 'SCHEDULED' || e.status === 'QUEUED';
        return e.status === statusFilter;
      });
    }

    // Starred filter
    if (starredOnly) {
      result = result.filter((e) => starredIds.has(e.id));
    }

    // Sorting
    result.sort((a, b) => {
      const timeA = new Date(a.scheduledAt || a.sentAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.scheduledAt || b.sentAt || b.createdAt || 0).getTime();
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [emails, statusFilter, starredOnly, sortBy, starredIds]);

  const formatScheduledDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-white overflow-hidden min-w-0 font-sans">
      {/* 1. Top Bar: Search, Filter, Refresh */}
      <div className="p-4 sm:px-8 sm:py-4 border-b border-gray-100 flex items-center gap-3 w-full flex-shrink-0">
        <div className="flex-1 relative min-w-0">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="email-search-input"
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 bg-gray-100 text-sm text-gray-800 placeholder-gray-400 rounded-full border-0 outline-none focus:bg-gray-50 focus:ring-1 focus:ring-green-600 transition-all"
          />
        </div>

        {/* Filter Container & Active Button */}
        <div className="relative flex-shrink-0" ref={filterRef}>
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-2 rounded-full transition-all cursor-pointer relative flex items-center justify-center ${
              isFilterOpen || hasActiveFilters
                ? 'bg-green-100 text-green-700 ring-2 ring-green-600/30'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
            title="Filter & Sort"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-600" />
            )}
          </button>

          {/* Filter Dropdown Popover */}
          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 z-50 animate-fade-in text-xs font-sans">
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-gray-100">
                <span className="font-bold text-gray-900 text-sm">Filter & Sort</span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-[11px] text-green-600 font-semibold hover:underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="mb-3 space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['ALL', 'SCHEDULED', 'SENT', 'FAILED'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors flex items-center justify-between cursor-pointer ${
                        statusFilter === st
                          ? 'bg-green-50 text-green-700 font-bold border border-green-200'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{st === 'ALL' ? 'All Statuses' : st.charAt(0) + st.slice(1).toLowerCase()}</span>
                      {statusFilter === st && <Check className="w-3 h-3 text-green-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Starred Filter */}
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setStarredOnly(!starredOnly)}
                  className={`w-full px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    starredOnly
                      ? 'bg-amber-50 text-amber-800 font-bold border border-amber-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Star className={`w-3.5 h-3.5 ${starredOnly ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} />
                    <span>Starred Only</span>
                  </div>
                  {starredOnly && <Check className="w-3 h-3 text-amber-600" />}
                </button>
              </div>

              {/* Sort Order */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Sort By
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSortBy('newest')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors flex items-center justify-between cursor-pointer ${
                      sortBy === 'newest'
                        ? 'bg-green-50 text-green-700 font-bold border border-green-200'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>Newest First</span>
                    {sortBy === 'newest' && <Check className="w-3 h-3 text-green-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSortBy('oldest')}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors flex items-center justify-between cursor-pointer ${
                      sortBy === 'oldest'
                        ? 'bg-green-50 text-green-700 font-bold border border-green-200'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>Oldest First</span>
                    {sortBy === 'oldest' && <Check className="w-3 h-3 text-green-600" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Refresh Icon Button */}
        <button
          type="button"
          onClick={onRefresh}
          className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 cursor-pointer"
          title="Refresh"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Email List Content */}
      <div className="flex-1 overflow-y-auto w-full">
        {loading ? (
          // Skeleton loading
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="px-6 sm:px-8 py-4.5 flex items-center gap-4">
                <div className="w-24 h-4 skeleton" />
                <div className="w-32 h-6 skeleton rounded-full" />
                <div className="flex-1 h-4 skeleton" />
                <div className="w-5 h-5 skeleton rounded-full" />
              </div>
            ))}
          </div>
        ) : displayEmails.length === 0 ? (
          // Empty state
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-300">
              <Clock className="w-7 h-7" />
            </div>
            <p className="text-base font-semibold text-gray-700">
              {hasActiveFilters ? 'No emails match your filter criteria' : `No ${activeTab} emails found`}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-green-600 font-semibold hover:underline cursor-pointer"
                >
                  Reset all filters
                </button>
              ) : activeTab === 'scheduled' ? (
                'Emails scheduled to send in the future will appear here.'
              ) : (
                'Emails that have been delivered will appear here.'
              )}
            </p>
          </div>
        ) : (
          // Flat list of rows with thin bottom border
          <div className="divide-y divide-gray-100">
            {displayEmails.map((email) => {
              const recipientDisplay = email.to
                ? email.to.includes('@')
                  ? email.to.split('@')[0]
                  : email.to
                : 'Unknown';
              const cleanBody = email.body
                ? email.body.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim()
                : '';
              const isStarred = starredIds.has(email.id);

              return (
                <div
                  key={email.id}
                  onClick={() => onSelectEmail(email)}
                  className="px-6 sm:px-8 py-4 flex items-center justify-between hover:bg-gray-50/70 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-4">
                    {/* Left: "To: [Name]" bold label */}
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                      To: {recipientDisplay}
                    </span>

                    {/* Status Badge */}
                    {activeTab === 'scheduled' || email.status === 'SCHEDULED' || email.status === 'QUEUED' ? (
                      /* Scheduled: orange pill badge with clock icon + time text */
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80 flex-shrink-0">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        {formatScheduledDate(email.scheduledAt)}
                      </span>
                    ) : email.status === 'RATE_LIMITED' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 flex-shrink-0">
                        Rate Limited
                      </span>
                    ) : email.status === 'FAILED' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 flex-shrink-0">
                        Failed
                      </span>
                    ) : (
                      /* Sent: plain gray pill badge with text "Sent" */
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 flex-shrink-0">
                        Sent
                      </span>
                    )}

                    {/* Subject line (bold) followed by " · " and preview snippet of body */}
                    <div className="text-sm truncate min-w-0 flex-1 flex items-center gap-2">
                      <span className="font-bold text-gray-900 whitespace-nowrap">
                        {email.subject || '(No Subject)'}
                      </span>
                      {cleanBody && (
                        <>
                          <span className="text-gray-400 font-normal">·</span>
                          <span className="text-gray-400 font-normal truncate">
                            {cleanBody}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Far right: Preview link + Outlined/Filled Star icon */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {email.previewUrl && (
                      <a
                        href={email.previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="View sent email on Ethereal"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Preview
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(email.id);
                      }}
                      className={`p-1.5 transition-colors cursor-pointer rounded-full hover:bg-gray-100 ${
                        isStarred ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'
                      }`}
                      title={isStarred ? 'Unstar email' : 'Star email'}
                    >
                      <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
