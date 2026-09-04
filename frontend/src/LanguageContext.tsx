import { createContext, useContext, useState, type ReactNode } from "react"

export type Lang = "en" | "bn"

interface LanguageContextValue {
  lang: Lang
  toggleLang: () => void
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  toggleLang: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return localStorage.getItem("hs-lang") as Lang || "en"
    } catch {
      return "en"
    }
  })

  const toggleLang = () => {
    const next: Lang = lang === "en" ? "bn" : "en"
    setLang(next)
    try {
      localStorage.setItem("hs-lang", next)
    } catch {
      /* blocked */
    }
  }

  return (
    <LanguageContext.Provider value={{ lang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
