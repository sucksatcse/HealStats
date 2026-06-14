import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store';

export function SurgeModeBanner() {
  const { t } = useTranslation();
  const surgeMode = useAppStore((state) => state.ui.surgeMode);

  if (!surgeMode) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 shadow-sm">
      {t('common.surgeMode')}
    </div>
  );
}