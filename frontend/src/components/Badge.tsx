import type { EmailStatus } from '../types';

type BadgeVariant = EmailStatus | 'default';

const variantConfig: Record<BadgeVariant, { bg: string; text: string; dot: string; label: string }> = {
  SCHEDULED: {
    bg: 'bg-amber-50 border border-amber-200/80',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    label: 'Scheduled',
  },
  QUEUED: {
    bg: 'bg-amber-50 border border-amber-200/80',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    label: 'Queued',
  },
  PROCESSING: {
    bg: 'bg-blue-50 border border-blue-200/80',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    label: 'Processing',
  },
  SENT: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
    label: 'Sent',
  },
  FAILED: {
    bg: 'bg-red-50 border border-red-200/80',
    text: 'text-red-700',
    dot: 'bg-red-500',
    label: 'Failed',
  },
  RATE_LIMITED: {
    bg: 'bg-orange-50 border border-orange-200/80',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    label: 'Rate Limited',
  },
  default: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
    dot: 'bg-gray-400',
    label: 'Unknown',
  },
};

interface BadgeProps {
  status: string;
  showDot?: boolean;
}

export default function Badge({ status, showDot = true }: BadgeProps) {
  const config = variantConfig[status as BadgeVariant] ?? variantConfig.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${config.dot} ${
            status === 'PROCESSING' ? 'animate-pulse' : ''
          }`}
        />
      )}
      {config.label}
    </span>
  );
}
