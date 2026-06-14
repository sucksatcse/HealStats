import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store';

export function SyncStatusBadge() {
  const { t } = useTranslation();
  const syncStatus = useAppStore((state) => state.ui.syncStatus);
  const pendingCount = useAppStore((state) => state.ui.pendingCount);

  const config = {
    idle: {
      label: pendingCount > 0 ? `${pendingCount} ${t('status.queued')}` : `${t('status.synced')} · ${t('common.synced')}`,
      tone: pendingCount > 0 ? 'bg-amber-100 text-amber-800 ring-amber-200' : 'bg-emerald-100 text-emerald-800 ring-emerald-200',
      dot: pendingCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'
    },
    syncing: {
      label: t('common.syncing'),
      tone: 'bg-blue-100 text-blue-800 ring-blue-200',
      dot: 'bg-blue-500'
    },
    offline: {
      label: t('common.offline'),
      tone: 'bg-orange-100 text-orange-800 ring-orange-200',
      dot: 'bg-orange-500'
    },
    error: {
      label: t('common.failed'),
      tone: 'bg-rose-100 text-rose-800 ring-rose-200',
      dot: 'bg-rose-500'
    }
  } satisfies Record<string, { label: string; tone: string; dot: string }>;

  const current = config[syncStatus];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 ${current.tone}`}>
      <span className={`h-2.5 w-2.5 rounded-full ${current.dot} ${syncStatus === 'syncing' ? 'spin' : ''}`} />
      <span>{current.label}</span>
      {pendingCount > 0 && syncStatus === 'idle' ? <span className="text-xs font-bold uppercase tracking-[0.18em]">{pendingCount}</span> : null}
    </span>
  );
}