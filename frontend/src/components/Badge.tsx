import type { EmailStatus } from '../types';

type BadgeVariant = EmailStatus | 'default';

const variantConfig: Record<BadgeVariant, { bg: string; text: string; dot: string; label: string }> = {
  SCHEDULED: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
    label: 'Scheduled',
  },
  QUEUED: {
    bg: 'bg-indigo-500/15',
    text: 'text-indigo-400',
    dot: 'bg-indigo-400',
    label: 'Queued',
  },
  PROCESSING: {
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    dot: 'bg-yellow-400',
    label: 'Processing',
  },
  SENT: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    label: 'Sent',
  },
  FAILED: {
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    dot: 'bg-red-400',
    label: 'Failed',
  },
  RATE_LIMITED: {
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    dot: 'bg-orange-400',
    label: 'Rate Limited',
  },
  default: {
    bg: 'bg-white/10',
    text: 'text-white/60',
    dot: 'bg-white/40',
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
