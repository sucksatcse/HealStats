import { PageFrame } from '../components/PageFrame';
import { useAppStore } from '../store';
import { useTranslation } from 'react-i18next';

export function DashboardPage() {
  const { t } = useTranslation();
  const user = useAppStore((state) => state.user);
  const pendingCount = useAppStore((state) => state.pendingCount);
  const syncStatus = useAppStore((state) => state.syncStatus);

  return (
    <PageFrame title={t('pages.dashboard.title')} description={t('pages.dashboard.description')}>
      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Logged in user</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{user?.name ?? 'Unknown'}</p>
        </article>
        <article className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Sync status</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{syncStatus}</p>
        </article>
        <article className="rounded-2xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">{t('status.pending')}</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{pendingCount}</p>
        </article>
      </div>
    </PageFrame>
  );
}