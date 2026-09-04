import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react"

interface ThemeContextValue {
  dark: boolean
  toggleDark: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  dark: false,
  toggleDark: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem("hs-theme") === "dark"
    } catch {
      return false
    }
  })

  /* Single source of truth: the .dark class lives on <html>, nowhere else. */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    try {
      localStorage.setItem("hs-theme", dark ? "dark" : "light")
    } catch {
      /* blocked */
    }
  }, [dark])

  const toggleDark = () => setDark((d) => !d)

  return (
    <ThemeContext.Provider value={{ dark, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
