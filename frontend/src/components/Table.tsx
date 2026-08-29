import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  keyExtractor: (row: T) => string;
}

const SKELETON_ROWS = 5;

function SkeletonRow({ colCount }: { colCount: number }) {
  return (
    <tr>
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="skeleton h-4 w-full max-w-[180px]" />
        </td>
      ))}
    </tr>
  );
}

export default function Table<T>({
  columns,
  data,
  loading = false,
  error = null,
  onRetry,
  emptyTitle = 'No data yet',
  emptyDescription = 'Nothing to display.',
  emptyIcon,
  keyExtractor,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/5 bg-surface-50/50">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-4 text-left text-xs font-semibold text-white/40 uppercase tracking-wider"
                  style={col.width ? { width: col.width } : {}}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {/* Loading state */}
            {loading &&
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <SkeletonRow key={i} colCount={columns.length} />
              ))}

            {/* Error state */}
            {!loading && error && (
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p className="text-white/60 font-medium">Failed to load data</p>
                      <p className="text-white/30 text-xs mt-1">{error}</p>
                    </div>
                    {onRetry && (
                      <button
                        onClick={onRetry}
                        className="px-4 py-2 text-xs font-medium rounded-lg bg-brand-600/20 text-brand-400 border border-brand-500/30 hover:bg-brand-600/30 transition-colors"
                      >
                        Try again
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* Empty state */}
            {!loading && !error && data.length === 0 && (
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="w-14 h-14 rounded-full bg-brand-500/10 flex items-center justify-center">
                      {emptyIcon ?? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-brand-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-white/60 font-medium">{emptyTitle}</p>
                      <p className="text-white/30 text-xs mt-1">{emptyDescription}</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {/* Data rows */}
            {!loading &&
              !error &&
              data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 text-white/80 group-hover:text-white transition-colors">
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
