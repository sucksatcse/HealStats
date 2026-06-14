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
    <div className="fixed right-4 top-4 z-50 flex w-[min(92vw,360px)] flex-col gap-3">
      {toasts.map((toast) => {
        const tone =
          toast.tone === 'error'
            ? 'border-rose-200 bg-rose-50 text-rose-800'
            : toast.tone === 'info'
              ? 'border-sky-200 bg-sky-50 text-sky-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800';

        return (
          <div key={toast.id} className={`rounded-2xl border px-4 py-3 shadow-soft ${tone}`}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium leading-6">{toast.message}</p>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-lg leading-none opacity-60 transition hover:opacity-100"
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
