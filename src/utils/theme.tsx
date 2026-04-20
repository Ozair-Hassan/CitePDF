import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

export type Theme = 'light' | 'dark' | 'auto'
export type ResolvedTheme = 'light' | 'dark'

export interface ThemeTokens {
  // Outer container
  containerBorder: string

  pdfAreaBg: string
  pagePlaceholderBg: string
  pagePlaceholderText: string
  pageShadow: string

  // Navigation bar
  navBarBg: string
  navBarBorder: string
  navBarShadow: string
  navBarTextStrong: string
  navBarTextMuted: string
  navBarTextSoft: string
  navBarButtonBg: string
  navBarButtonBgHover: string
  navBarButtonBorder: string
  navBarButtonText: string
  navBarInputBg: string
  navBarInputBgActive: string
  navBarInputBorder: string
  navBarInputBorderActive: string
  navBarInputText: string
  navBarInputGlow: string

  // Citation sidebar
  sidebarBg: string
  sidebarBorder: string
  sidebarHeading: string
  sidebarItemBg: string
  sidebarItemBgActive: string
  sidebarItemBgFailed: string
  sidebarItemBorder: string
  sidebarItemBorderActive: string
  sidebarItemBorderFailed: string
  sidebarItemText: string
  sidebarItemTextActive: string
  sidebarItemTextFailed: string
  sidebarItemTextMeta: string
  sidebarItemTextMetaFailed: string

  // Highlight defaults (overridable via props)
  highlightDefault: string
  highlightActive: string

  // Error state
  errorText: string
}

export const LIGHT_THEME: ThemeTokens = {
  containerBorder: '#e2e8f0',

  pdfAreaBg: '#525659',
  pagePlaceholderBg: '#ffffff',
  pagePlaceholderText: '#94a3b8',
  pageShadow: '0 4px 24px rgba(0,0,0,0.4)',

  navBarBg: '#ffffff',
  navBarBorder: '#e2e8f0',
  navBarShadow: '0 1px 3px rgba(0,0,0,0.06)',
  navBarTextStrong: '#374151',
  navBarTextMuted: '#6b7280',
  navBarTextSoft: '#9ca3af',
  navBarButtonBg: '#ffffff',
  navBarButtonBgHover: '#f1f5f9',
  navBarButtonBorder: '#e2e8f0',
  navBarButtonText: '#374151',
  navBarInputBg: '#f9fafb',
  navBarInputBgActive: '#f5f3ff',
  navBarInputBorder: '#d1d5db',
  navBarInputBorderActive: '#6366f1',
  navBarInputText: '#111827',
  navBarInputGlow: '0 0 0 3px rgba(99,102,241,0.12)',

  sidebarBg: '#f8fafc',
  sidebarBorder: '#e2e8f0',
  sidebarHeading: '#64748b',
  sidebarItemBg: '#ffffff',
  sidebarItemBgActive: '#dbeafe',
  sidebarItemBgFailed: '#fff7ed',
  sidebarItemBorder: '#e2e8f0',
  sidebarItemBorderActive: '#93c5fd',
  sidebarItemBorderFailed: '#fed7aa',
  sidebarItemText: '#334155',
  sidebarItemTextActive: '#1d4ed8',
  sidebarItemTextFailed: '#9a3412',
  sidebarItemTextMeta: '#94a3b8',
  sidebarItemTextMetaFailed: '#c2410c',

  highlightDefault: 'rgba(250, 204, 21, 0.4)',
  highlightActive: 'rgba(59, 130, 246, 0.28)',

  errorText: '#dc2626',
}

export const DARK_THEME: ThemeTokens = {
  containerBorder: '#1f2937',

  pdfAreaBg: '#0f172a',
  pagePlaceholderBg: '#1e293b',
  pagePlaceholderText: '#64748b',
  pageShadow: '0 4px 24px rgba(0,0,0,0.6)',

  navBarBg: '#111827',
  navBarBorder: '#1f2937',
  navBarShadow: '0 1px 3px rgba(0,0,0,0.35)',
  navBarTextStrong: '#e5e7eb',
  navBarTextMuted: '#9ca3af',
  navBarTextSoft: '#6b7280',
  navBarButtonBg: '#1f2937',
  navBarButtonBgHover: '#374151',
  navBarButtonBorder: '#374151',
  navBarButtonText: '#e5e7eb',
  navBarInputBg: '#1f2937',
  navBarInputBgActive: '#312e81',
  navBarInputBorder: '#374151',
  navBarInputBorderActive: '#818cf8',
  navBarInputText: '#f3f4f6',
  navBarInputGlow: '0 0 0 3px rgba(129,140,248,0.25)',

  sidebarBg: '#0f172a',
  sidebarBorder: '#1f2937',
  sidebarHeading: '#94a3b8',
  sidebarItemBg: '#1e293b',
  sidebarItemBgActive: '#1e3a8a',
  sidebarItemBgFailed: '#431407',
  sidebarItemBorder: '#334155',
  sidebarItemBorderActive: '#3b82f6',
  sidebarItemBorderFailed: '#9a3412',
  sidebarItemText: '#cbd5e1',
  sidebarItemTextActive: '#bfdbfe',
  sidebarItemTextFailed: '#fdba74',
  sidebarItemTextMeta: '#64748b',
  sidebarItemTextMetaFailed: '#fb923c',

  highlightDefault: 'rgba(250, 204, 21, 0.5)',
  highlightActive: 'rgba(96, 165, 250, 0.45)',

  errorText: '#f87171',
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'auto') {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function'
    ) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
    }
    return 'light'
  }
  return theme
}

export function getThemeTokens(resolved: ResolvedTheme): ThemeTokens {
  return resolved === 'dark' ? DARK_THEME : LIGHT_THEME
}

export function useResolvedTheme(theme: Theme = 'light'): ResolvedTheme {
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    resolveTheme(theme),
  )

  useEffect(() => {
    if (theme !== 'auto') {
      setResolved(theme)
      return
    }
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setResolved(mq.matches ? 'dark' : 'light')
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [theme])

  return resolved
}

const ThemeContext = createContext<ThemeTokens>(LIGHT_THEME)

export { ThemeContext }

export function useTheme(): ThemeTokens {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  theme?: Theme
  children: ReactNode
}

export function ThemeProvider({
  theme = 'light',
  children,
}: ThemeProviderProps) {
  const resolved = useResolvedTheme(theme)
  const tokens = getThemeTokens(resolved)
  return (
    <ThemeContext.Provider value={tokens}>{children}</ThemeContext.Provider>
  )
}
