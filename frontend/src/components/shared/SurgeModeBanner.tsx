import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store';

export function SurgeModeBanner() {
  const { t } = useTranslation();
  const surgeMode = useAppStore((state) => state.ui.surgeMode);
  const setSurgeMode = useAppStore((state) => state.setSurgeMode);

  if (!surgeMode) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-4 py-3 text-sm font-semibold text-white shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <span className="h-3 w-3 rounded-full bg-white/90 pulse-ring" />
        <span className="truncate">{t('common.surgeMode')}</span>
      </div>
      <button
        type="button"
        onClick={() => setSurgeMode(false)}
        className="rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-rose-600"
      >
        Deactivate
      </button>
    </div>
  );
}