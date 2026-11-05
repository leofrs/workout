import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { readStored, saveStored } from './data'
import portuguese from './locales/pt-BR.json'

export type Language = 'en' | 'pt-BR'
const translations: Record<string, string> = portuguese
const portugueseText = (text: string) => Object.hasOwn(translations, text) ? translations[text] : text
type Translate = (text: string, values?: Record<string, string | number>) => string
type LanguageContext = { language: Language; locale: string; setLanguage: (language: Language) => void; t: Translate }
const Context = createContext<LanguageContext | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = readStored<unknown>('language', null)
    if (stored === 'en' || stored === 'pt-BR') return stored
    return navigator.language.toLowerCase().startsWith('pt') ? 'pt-BR' : 'en'
  })
  const locale = language === 'en' ? 'en-US' : 'pt-BR'
  const t: Translate = useCallback((text, values) => {
    const translated = language === 'pt-BR' ? portugueseText(text) : text
    return translated.replace(/\{(\w+)\}/g, (match, key: string) => String(values?.[key] ?? match))
  }, [language])

  useEffect(() => {
    saveStored('language', language)
    document.documentElement.lang = language
    document.title = t('FORM — Your training, with intention.')
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('Your plan. Your pace. Track your four-day strength program, log every set, and build a stronger you with FORM.'))
  }, [language, t])

  return <Context.Provider value={{ language, locale, setLanguage, t }}>{children}</Context.Provider>
}

export function useLanguage() {
  const context = useContext(Context)
  if (!context) throw new Error('useLanguage requires LanguageProvider')
  return context
}

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()
  return <div className="language-switcher" role="group" aria-label={t('Language')}>
    <button type="button" lang="en" aria-label="English" aria-pressed={language === 'en'} onClick={() => setLanguage('en')}>EN</button>
    <button type="button" lang="pt-BR" aria-label="Português do Brasil" aria-pressed={language === 'pt-BR'} onClick={() => setLanguage('pt-BR')}>PT-BR</button>
  </div>
}

// Let searches match accented Portuguese names as well as the original English names.
const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
export const matchesTranslatedSearch = (text: string, query: string) =>
  [text, portugueseText(text)].some(name => normalizeSearch(name).includes(normalizeSearch(query)))
