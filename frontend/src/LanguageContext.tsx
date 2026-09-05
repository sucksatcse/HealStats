import { createContext, useContext, useEffect, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

export type Lang = "en" | "bn"

interface LanguageContextValue {
  lang: Lang
  toggleLang: () => void
  setLang: (lang: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  toggleLang: () => {},
  setLang: () => {},
})

/**
 * Thin wrapper over i18next so the whole app keeps using the familiar `useLang()`
 * API while i18next remains the single source of truth for the active language
 * (and its persistence). Changing the language here updates every component that
 * uses either `useLang()` or `useTranslation()`.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const lang: Lang = i18n.resolvedLanguage === "bn" ? "bn" : "en"

  const setLang = (next: Lang) => {
    i18n.changeLanguage(next)
  }

  const toggleLang = () => {
    setLang(lang === "en" ? "bn" : "en")
  }

  // Keep the document language attribute in sync for accessibility.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
