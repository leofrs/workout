import { useEffect, useRef, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { readStored, saveStored } from './data'
import { useLanguage } from './i18n'

type Theme = 'light' | 'dark'
const storedTheme = () => {
  const value = readStored<unknown>('theme', null)
  return value === 'light' || value === 'dark' ? value : null
}

export function ThemeToggle() {
  const { t } = useLanguage()
  const preference = useRef(storedTheme())
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#fafafa')
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const followSystem = () => {
      if (!preference.current) setTheme(media.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', followSystem)
    return () => media.removeEventListener('change', followSystem)
  }, [])

  const label = t(theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme')
  return <button type="button" className="theme-toggle icon-button" aria-label={label} title={label} onClick={() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    preference.current = next
    saveStored('theme', next)
    setTheme(next)
  }}>
    {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
  </button>
}
