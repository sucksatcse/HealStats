import { useEffect } from 'react';
import { useAppStore } from '../../store';

export function ToastStack() {
  const toasts = useAppStore((state) => state.toasts);
  const removeToast = useAppStore((state) => state.removeToast);

  useEffect(() => {
    if (toasts.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      removeToast(toasts[0].id);
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [removeToast, toasts]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(92vw,380px)] flex-col gap-3">
      {toasts.map((toast) => {
        const tone =
          toast.tone === 'error'
            ? 'border-l-rose-500 bg-white text-slate-900'
            : toast.tone === 'info'
              ? 'border-l-blue-500 bg-white text-slate-900'
              : 'border-l-emerald-500 bg-white text-slate-900';

        const icon = toast.tone === 'error' ? '⛔' : toast.tone === 'info' ? 'ℹ️' : '✅';

        return (
          <div key={toast.id} className={`rounded-xl border border-slate-200 border-l-4 px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.12)] ${tone}`}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 text-base">{icon}</span>
              <p className="flex-1 text-sm font-medium leading-6 text-slate-700">{toast.message}</p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-lg leading-none text-slate-400 transition hover:text-slate-700"
                aria-label="Dismiss toast"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
