// ─── components ───────────────────────────────────────────────────────────────
export { CitationViewer } from './components/CitationViewer'
export type { CitationViewerHandle } from './components/CitationViewer'
export type { Theme, ResolvedTheme, ThemeTokens } from './utils/theme'
// Sub-components — exported so consumers can compose headless UIs
export { CitationSidebar } from './components/CitationSidebar'
export { NavigationBar } from './components/NavigationBar'
export { HighlightOverlay } from './components/HighlightOverlay'
export { PDFRenderer } from './components/PDFRenderer'
export type { PDFRendererHandle } from './components/PDFRenderer'

// ─── types ────────────────────────────────────────────────────────────────────
export type {
  Citation,
  CitationItem,
  CitationViewerProps,
  CitationViewerClassNames,
  CitationViewerStyles,
  PDFRendererProps,
  HighlightOverlayProps,
  CitationSidebarProps,
  NavigationBarProps,
  BoundingBox,
} from './types'
