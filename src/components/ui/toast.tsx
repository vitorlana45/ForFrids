'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  removing: boolean;
}

interface ToastAPI {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const DURATION = 4000;
const EXIT_DURATION = 300;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  function removeToast(id: string) {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, removing: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, EXIT_DURATION);
  }

  const addToast = useCallback((message: string, variant: ToastVariant) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant, removing: false }]);
    const timer = setTimeout(() => removeToast(id), DURATION);
    timersRef.current.set(id, timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  const api: ToastAPI = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    info: (msg) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="fixed bottom-24 right-4 z-[300] flex flex-col gap-2 md:bottom-6 md:right-6"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <ToastEntry key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const STYLES: Record<ToastVariant, { border: string; icon: ReactNode }> = {
  success: {
    border: 'border-primary/20',
    icon: <CheckCircle className="h-5 w-5 shrink-0 text-primary" />,
  },
  error: {
    border: 'border-error/20',
    icon: <XCircle className="h-5 w-5 shrink-0 text-error" />,
  },
  info: {
    border: 'border-outline-variant/30',
    icon: <Info className="h-5 w-5 shrink-0 text-secondary" />,
  },
};

function ToastEntry({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const { border, icon } = STYLES[toast.variant];

  return (
    <div
      className={`flex w-full max-w-sm items-center gap-3 rounded-2xl border bg-surface px-4 py-3.5 shadow-lg transition-all duration-300 ${border} ${
        toast.removing ? 'translate-x-4 opacity-0' : 'translate-x-0 opacity-100'
      }`}
    >
      {icon}
      <p className="flex-1 text-sm font-medium text-on-surface">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-on-surface-variant transition-colors hover:text-on-surface"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
