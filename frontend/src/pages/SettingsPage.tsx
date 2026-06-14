import { useTranslation } from 'react-i18next';
import { useAppStore, type SyncStatus } from '../store';

const syncCycle: SyncStatus[] = ['synced', 'syncing', 'offline', 'error'];

export function SettingsPage() {
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const syncStatus = useAppStore((state) => state.ui.syncStatus);
  const surgeMode = useAppStore((state) => state.ui.surgeMode);
  const setSyncStatus = useAppStore((state) => state.setSyncStatus);
  const setSurgeMode = useAppStore((state) => state.setSurgeMode);

  const cycleSync = () => {
    const nextIndex = (syncCycle.indexOf(syncStatus) + 1) % syncCycle.length;
    setSyncStatus(syncCycle[nextIndex]);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t('pages.settings.title')}</h1>
        <p className="mt-2 text-sm text-slate-600">{t('pages.settings.description')}</p>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">{t('pages.settings.profile')}</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>{t('pages.settings.currentLanguage')}: {language.toUpperCase()}</p>
            <p>{t('pages.settings.currentStatus')}: {syncStatus}</p>
            <p>{t('pages.settings.surgeMode')}: {surgeMode ? 'On' : 'Off'}</p>
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">{t('pages.settings.preferences')}</p>
          <button type="button" onClick={cycleSync} className="mt-4 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-soft">
            {t('pages.settings.toggleSync')}
          </button>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">{t('pages.settings.offlineTools')}</p>
          <button
            type="button"
            onClick={() => setSurgeMode(!surgeMode)}
            className={[
              'mt-4 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-soft',
              surgeMode ? 'bg-rose-500' : 'bg-slate-700'
            ].join(' ')}
          >
            {t('pages.settings.toggleSurge')}
          </button>
        </article>
      </div>
    </div>
  );
}
