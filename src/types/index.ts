import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { Theme } from '../utils/theme'

export interface Citation {
  id: number
  label?: string
  page?: number
  text: string
}

export type CitationItem = Citation

export interface CitationViewerClassNames {
  container?: string
  navBar?: string
  sidebar?: string
  pdfArea?: string
}

export interface CitationViewerStyles {
  container?: React.CSSProperties
  navBar?: React.CSSProperties
  sidebar?: React.CSSProperties
  pdfArea?: React.CSSProperties
}

export interface CitationViewerHandle {
  jumpToPage: (page: number) => void
  setActiveCitation: (id: number) => void
  clearActiveCitation: () => void
  getActiveCitationId: () => number | undefined
  getTotalPages: () => number
}

export interface CitationViewerProps {
  file: string | Uint8Array
  citations?: Citation[]
  initialPage?: number
  onCitationClick?: (id: number) => void
  onPageChange?: (page: number) => void

  hideSidebar?: boolean
  hideNav?: boolean
  theme?: Theme
  classNames?: CitationViewerClassNames
  styles?: CitationViewerStyles

  /** CSS color string for inactive citation highlights. Default: rgba(250,204,21,0.4) */
  highlightColor?: string
  /** CSS color string for the active citation highlight.  Default: rgba(59,130,246,0.28) */
  activeHighlightColor?: string
}

// ─── sub-component props ──────────────────────────────────────────────────────

export interface PDFRendererProps {
  file: string | Uint8Array
  scale: number
  onDocumentLoaded: (numPages: number) => void
  onDocumentProxy?: (doc: PDFDocumentProxy) => void
  onVisiblePageChange?: (page: number) => void
  onAllPagesReady?: (pages: Map<number, PDFPageProxy>) => void
  citations?: CitationItem[]
  activeCitationId?: number
  highlightColor?: string
  activeHighlightColor?: string
  className?: string
  style?: React.CSSProperties
}

export interface HighlightOverlayProps {
  citations: Citation[]
  currentPage: number
  scale: number
  activeCitationId?: number
  page: PDFPageProxy | null
  highlightColor?: string
  activeHighlightColor?: string
}

export interface CitationSidebarProps {
  citations: Citation[]
  activeCitationId?: number
  failedCitationIds?: Set<number>
  onCitationClick: (id: number) => void
  className?: string
  style?: React.CSSProperties
}

export interface NavigationBarProps {
  currentPage: number
  totalPages: number
  scale: number
  onPageChange: (page: number) => void
  onScaleChange: (scale: number) => void
  className?: string
  style?: React.CSSProperties
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}
