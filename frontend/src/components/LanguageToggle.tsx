import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useAppStore } from '../store';

export function LanguageToggle() {
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const nextLanguage = language === 'en' ? 'bn' : 'en';

  return (
    <button
      type="button"
      onClick={() => {
        setLanguage(nextLanguage);
        i18n.changeLanguage(nextLanguage);
      }}
      className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-700 transition hover:bg-sky-100"
    >
      {t('auth.language')}: {language.toUpperCase()}
    </button>
  );
}