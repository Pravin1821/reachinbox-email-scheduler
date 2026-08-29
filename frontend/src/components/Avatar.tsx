interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Avatar({ src, name, size = 'md' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'User avatar'}
        referrerPolicy="no-referrer"
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-brand-500/30`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-brand flex items-center justify-center font-semibold text-white ring-2 ring-brand-500/30`}
      aria-label={name ?? 'User avatar'}
    >
      {getInitials(name)}
    </div>
  );
}
