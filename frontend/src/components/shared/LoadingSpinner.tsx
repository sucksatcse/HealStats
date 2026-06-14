import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-3xl border border-slate-200 bg-white/90 px-6 py-10 text-slate-600 shadow-soft">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-sky-100 border-t-sky-500" />
      <p className="text-sm font-medium">{message ?? t('common.loading')}</p>
    </div>
  );
}