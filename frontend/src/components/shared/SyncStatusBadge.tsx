import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store';

export function SyncStatusBadge() {
  const { t } = useTranslation();
  const syncStatus = useAppStore((state) => state.ui.syncStatus);
  const pendingCount = useAppStore((state) => state.ui.pendingCount);

  const config = {
    idle: {
      label: pendingCount > 0 ? `🟡 ${pendingCount} ${t('status.queued')}` : `🟢 ${t('status.synced')}`,
      tone: pendingCount > 0 ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      dot: pendingCount > 0 ? 'bg-amber-400' : 'bg-emerald-500'
    },
    syncing: {
      label: `🔵 ${t('common.syncing')}`,
      tone: 'bg-sky-50 text-sky-700 ring-sky-200',
      dot: 'bg-sky-500'
    },
    offline: {
      label: `⚪ ${t('common.offline')}`,
      tone: 'bg-orange-50 text-orange-700 ring-orange-200',
      dot: 'bg-orange-500'
    },
    error: {
      label: `🔴 ${t('common.failed')}`,
      tone: 'bg-rose-50 text-rose-700 ring-rose-200',
      dot: 'bg-rose-500'
    }
  } satisfies Record<string, { label: string; tone: string; dot: string }>;

  const current = config[syncStatus];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${current.tone}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${current.dot}`} />
      {current.label}
    </span>
  );
}