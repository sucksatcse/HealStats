import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  const { t } = useTranslation();

  return (
    <div className="card flex min-h-[240px] flex-col gap-4 px-6 py-10 text-slate-600">
      <div className="space-y-3">
        <div className="shimmer h-5 w-44 rounded-full" />
        <div className="grid gap-3">
          <div className="shimmer h-4 w-full rounded-full" />
          <div className="shimmer h-4 w-5/6 rounded-full" />
          <div className="shimmer h-4 w-3/5 rounded-full" />
        </div>
      </div>
      <p className="text-sm font-medium text-slate-500">{message ?? t('common.loading')}</p>
    </div>
  );
}