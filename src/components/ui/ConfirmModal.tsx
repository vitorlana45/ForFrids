'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'default';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    if (process.env.NODE_ENV !== 'production') {
      // Context missing during HMR hot reload — restart dev server to clear.
      return () => Promise.resolve(false);
    }
    throw new Error('useConfirm must be used inside ConfirmModalProvider');
  }
  return ctx;
}

interface State extends ConfirmOptions {
  open: boolean;
}

export function ConfirmModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ open: false, message: '' });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setState({ ...options, open: true });
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  function handleConfirm() {
    setState((s) => ({ ...s, open: false }));
    resolverRef.current?.(true);
  }

  function handleCancel() {
    setState((s) => ({ ...s, open: false }));
    resolverRef.current?.(false);
  }

  const isDanger = state.variant === 'danger';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {state.open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Panel */}
          <div className="relative w-full max-w-sm animate-fade-in rounded-3xl bg-surface shadow-2xl border border-outline-variant/20 overflow-hidden">

            {/* Icon area */}
            <div className={`flex flex-col items-center px-10 pt-12 pb-8 ${isDanger ? 'bg-error-container/20' : 'bg-primary-fixed/10'}`}>
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-3xl mb-6 ${
                  isDanger ? 'bg-error-container' : 'bg-primary-fixed/40'
                }`}
              >
                {isDanger ? (
                  <Trash2 className="h-9 w-9 text-error" />
                ) : (
                  <AlertTriangle className="h-9 w-9 text-primary" />
                )}
              </div>

              {state.title && (
                <h2 className="font-serif text-2xl text-on-surface text-center leading-snug">
                  {state.title}
                </h2>
              )}
            </div>

            {/* Message + actions */}
            <div className="px-10 pt-6 pb-10">
              <p className="text-sm leading-loose text-on-surface-variant text-center mb-8">
                {state.message}
              </p>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={`w-full rounded-full py-3.5 text-sm font-semibold transition-colors ${
                    isDanger
                      ? 'bg-error text-on-error hover:bg-error/90'
                      : 'bg-primary text-on-primary hover:bg-[#3d4d41]'
                  }`}
                >
                  {state.confirmLabel ?? 'Confirmar'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full rounded-full border border-outline-variant/40 py-3.5 text-sm font-semibold text-on-surface-variant transition-colors hover:bg-surface-container"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
