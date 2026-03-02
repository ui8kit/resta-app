import { useEffect } from 'react';
import { cn } from '../lib/utils';

export const UI_DESIGN_TOAST_MESSAGE =
  'UI/UX design example — logic to be implemented separately.';

export type ToastProps = {
  message?: string;
  visible: boolean;
  onClose: () => void;
  duration?: number;
  className?: string;
};

export function Toast({
  message = UI_DESIGN_TOAST_MESSAGE,
  visible,
  onClose,
  duration = 9000,
  className,
}: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-class="toast"
      className={cn(
        'fixed bottom-4 left-4 z-50 flex items-start justify-between gap-3 max-w-sm rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-md',
        className
      )}
    >
      <span className="flex-1 min-w-0">{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        data-class="toast-close"
        className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        ✕
      </button>
    </div>
  );
}
