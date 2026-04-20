import {
  useRef,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { PDFRenderer, type PDFRendererHandle } from './PDFRenderer'
import { NavigationBar } from './NavigationBar'
import { CitationSidebar } from './CitationSidebar'
import { findTextPosition } from '../utils/findTextPosition'
import { ThemeContext, getThemeTokens, useResolvedTheme } from '../utils/theme'
import type { CitationViewerHandle, CitationViewerProps } from '../types'

export type { CitationViewerHandle }

export const CitationViewer = forwardRef<
  CitationViewerHandle,
  CitationViewerProps
>(function CitationViewer(
  {
    file,
    citations = [],
    initialPage = 1,
    onCitationClick,
    onPageChange,
    hideSidebar = false,
    hideNav = false,
    theme = 'light',
    classNames = {},
    styles = {},
    highlightColor,
    activeHighlightColor,
  },
  ref,
) {
  const resolvedTheme = useResolvedTheme(theme)
  const t = getThemeTokens(resolvedTheme)

  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1)
  const [activeCitationId, setActiveCitationId] = useState<number | undefined>()
  const [failedCitationIds, setFailedCitationIds] = useState<Set<number>>(
    new Set(),
  )
  const [allPageProxies, setAllPageProxies] = useState<
    Map<number, PDFPageProxy>
  >(new Map())
  const [resolvedPages, setResolvedPages] = useState<Record<number, number>>({})

  const docRef = useRef<PDFDocumentProxy | null>(null)
  const rendererRef = useRef<PDFRendererHandle>(null)
  const totalPagesRef = useRef(0)
  const activeCitationIdRef = useRef<number | undefined>(undefined)
  const isProgrammaticScroll = useRef(false)

  const pendingScrollRef = useRef<{ page: number; citationId: number } | null>(
    null,
  )

  totalPagesRef.current = totalPages
  activeCitationIdRef.current = activeCitationId

  const effectiveCitations = citations.map((c) => ({
    ...c,
    page: c.page ?? resolvedPages[c.id],
  }))

  const jumpToCitation = useCallback(
    async (id: number) => {
      const citation = citations.find((c) => c.id === id)
      if (!citation) return

      let targetPage = citation.page ?? resolvedPages[id]

      if (!targetPage && docRef.current) {
        const doc = docRef.current
        for (let p = 1; p <= totalPagesRef.current; p++) {
          const proxy = allPageProxies.get(p) ?? (await doc.getPage(p))
          const boxes = await findTextPosition(proxy, citation.text)
          if (boxes.length > 0) {
            targetPage = p
            setResolvedPages((prev) => ({ ...prev, [id]: p }))
            break
          }
        }
      }

      if (!targetPage) {
        console.warn(`[CitePDF] Could not find text for citation ${id}`)
        setFailedCitationIds((prev) => new Set(prev).add(id))
        return
      }

      setFailedCitationIds((prev) => {
        if (!prev.has(id)) return prev
        const next = new Set(prev)
        next.delete(id)
        return next
      })

      setActiveCitationId(id)
      onCitationClick?.(id)
      isProgrammaticScroll.current = true
      setCurrentPage(targetPage)

      if (totalPagesRef.current > 0 && rendererRef.current) {
        rendererRef.current.scrollToPage(targetPage)
        setTimeout(() => {
          isProgrammaticScroll.current = false
        }, 500)
      } else {
        pendingScrollRef.current = { page: targetPage, citationId: id }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [citations, allPageProxies, resolvedPages, onCitationClick],
  )

  useImperativeHandle(ref, () => ({
    jumpToPage(page) {
      if (page < 1 || page > totalPagesRef.current) return
      isProgrammaticScroll.current = true
      setCurrentPage(page)
      rendererRef.current?.scrollToPage(page)
      setTimeout(() => {
        isProgrammaticScroll.current = false
      }, 500)
    },
    setActiveCitation(id) {
      jumpToCitation(id)
    },
    clearActiveCitation() {
      setActiveCitationId(undefined)
    },
    getActiveCitationId() {
      return activeCitationIdRef.current
    },
    getTotalPages() {
      return totalPagesRef.current
    },
  }))

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages) return
    isProgrammaticScroll.current = true
    setCurrentPage(page)
    rendererRef.current?.scrollToPage(page)
    setTimeout(() => {
      isProgrammaticScroll.current = false
    }, 500)
  }

  function handleVisiblePageChange(page: number) {
    if (isProgrammaticScroll.current) return
    setCurrentPage(page)
    onPageChange?.(page)
  }

  const handleAllPagesReady = useCallback(
    (pages: Map<number, PDFPageProxy>) => {
      setAllPageProxies(pages)
      if (pendingScrollRef.current) {
        const { page } = pendingScrollRef.current
        pendingScrollRef.current = null
        requestAnimationFrame(() => {
          rendererRef.current?.scrollToPage(page)
          setTimeout(() => {
            isProgrammaticScroll.current = false
          }, 500)
        })
      }
    },
    [],
  )

  return (
    <ThemeContext.Provider value={t}>
      <div
        className={classNames.container}
        style={{
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${t.containerBorder}`,
          borderRadius: '8px',
          overflow: 'hidden',
          height: '100%',
          ...styles.container,
        }}
      >
        {!hideNav && (
          <NavigationBar
            currentPage={currentPage}
            totalPages={totalPages}
            scale={scale}
            onPageChange={handlePageChange}
            onScaleChange={setScale}
            className={classNames.navBar}
            style={styles.navBar}
          />
        )}

        <div
          style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}
        >
          <PDFRenderer
            ref={rendererRef}
            file={file}
            scale={scale}
            onDocumentLoaded={(n) => setTotalPages(n)}
            onDocumentProxy={(doc) => {
              docRef.current = doc
            }}
            onVisiblePageChange={handleVisiblePageChange}
            onAllPagesReady={handleAllPagesReady}
            citations={effectiveCitations}
            activeCitationId={activeCitationId}
            highlightColor={highlightColor}
            activeHighlightColor={activeHighlightColor}
            className={classNames.pdfArea}
            style={styles.pdfArea}
          />

          {!hideSidebar && citations.length > 0 && (
            <CitationSidebar
              citations={effectiveCitations}
              activeCitationId={activeCitationId}
              failedCitationIds={failedCitationIds}
              onCitationClick={jumpToCitation}
              className={classNames.sidebar}
              style={styles.sidebar}
            />
          )}
        </div>
      </div>
    </ThemeContext.Provider>
  )
})
