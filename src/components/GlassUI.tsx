import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Sparkles, X } from 'lucide-react';

export type GlassToastTone = 'success' | 'error' | 'info';

export interface GlassToastItem {
  id: string;
  title: string;
  description?: string;
  tone: GlassToastTone;
}

const toastSubscribers = new Set<(item: GlassToastItem) => void>();

export function pushToast(
  title: string,
  description?: string,
  tone: GlassToastTone = 'info'
): void {
  const item: GlassToastItem = {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    description,
    tone,
  };
  toastSubscribers.forEach((listener) => listener(item));
}

export const GlassSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const dims =
    size === 'sm' ? 'h-4 w-4 border-2' : size === 'lg' ? 'h-9 w-9 border-[3px]' : 'h-6 w-6 border-2';

  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block shrink-0 animate-spin rounded-full border-cyan-300/30 border-t-cyan-300 shadow-[0_0_14px_rgba(56,189,248,0.65)] ${dims} ${className}`}
    />
  );
};

export const GlassToastViewport: React.FC = () => {
  const [toasts, setToasts] = useState<GlassToastItem[]>([]);

  useEffect(() => {
    const handlePush = (item: GlassToastItem) => {
      setToasts((prev) => [...prev.slice(-3), item]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, 3800);
    };

    toastSubscribers.add(handlePush);
    return () => {
      toastSubscribers.delete(handlePush);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-20 right-4 z-[80] flex w-full max-w-sm flex-col gap-2.5 px-2 sm:px-0"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon =
            toast.tone === 'success'
              ? CheckCircle2
              : toast.tone === 'error'
                ? AlertCircle
                : Sparkles;
          const iconColor =
            toast.tone === 'success'
              ? 'text-emerald-300'
              : toast.tone === 'error'
                ? 'text-rose-300'
                : 'text-cyan-300';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.95 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="pointer-events-auto ss-glass-card flex items-start justify-between gap-3 rounded-2xl p-3.5 shadow-2xl"
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${iconColor}`} />
                <div className="min-w-0">
                  <div className="font-display text-xs font-bold text-white">{toast.title}</div>
                  {toast.description && (
                    <div className="text-[11px] text-slate-200 leading-snug mt-0.5">
                      {toast.description}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                aria-label="Dismiss notification"
                className="text-slate-300 hover:text-white transition p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
