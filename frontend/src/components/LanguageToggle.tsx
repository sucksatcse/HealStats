import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useAppStore } from '../store';

export function LanguageToggle() {
  const { t } = useTranslation();
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const languages = [
    { code: 'en' as const, label: t('language.en') },
    { code: 'bn' as const, label: t('language.bn') }
  ];

  return (
    <div className="inline-flex rounded-full border border-sky-100 bg-sky-50 p-1 text-sm font-medium text-sky-800 shadow-sm">
      {languages.map((item) => {
        const active = item.code === language;

        return (
          <button
            key={item.code}
            type="button"
            aria-pressed={active}
            onClick={() => {
              setLanguage(item.code);
              void i18n.changeLanguage(item.code);
            }}
            className={[
              'rounded-full px-3 py-1.5 transition',
              active ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            ].join(' ')}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}