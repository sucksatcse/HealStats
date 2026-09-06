// Centralized i18next configuration — the single source of truth for the active
// application language. English is the fallback; Bangla is the second language.
// The active language is persisted in localStorage under `hs-lang` (the same key
// the previous LanguageContext used, so existing preferences carry over).
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import en from './locales/en'
import bn from './locales/bn'

export const SUPPORTED_LANGUAGES = ['en', 'bn'] as const
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const NAMESPACES = ['common', 'navigation', 'urgency', 'map', 'chatbot', 'errors'] as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en, bn },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    nonExplicitSupportedLngs: true,
    ns: NAMESPACES as unknown as string[],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'hs-lang',
      caches: ['localStorage'],
    },
    returnNull: false,
    react: { useSuspense: false },
  })

export default i18n
