import { useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Prevent closing on backdrop click / ESC */
  disableClose?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'lg',
  disableClose = false,
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableClose) onClose();
    },
    [onClose, disableClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={disableClose ? undefined : onClose}
      />

      {/* Panel */}
      <div
        className={[
          'relative z-10 w-full glass-card shadow-card animate-slide-up',
          'border border-white/10 p-6',
          maxWidthClasses[maxWidth],
        ].join(' ')}
      >
        {/* Header */}
        {(title || !disableClose) && (
          <div className="flex items-center justify-between mb-6">
            {title && (
              <h2 className="text-lg font-semibold text-white">{title}</h2>
            )}
            {!disableClose && (
              <button
                onClick={onClose}
                className="ml-auto p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {children}
      </div>
    </div>,
    document.body,
  );
}
