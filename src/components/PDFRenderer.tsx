import {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import '../utils/pdfWorker'
import { useTheme } from '../utils/theme'
import type { PDFRendererProps } from '../types'
import { HighlightOverlay } from './HighlightOverlay'

export interface PDFRendererHandle {
  scrollToPage: (page: number) => void
  getPageProxy: (page: number) => PDFPageProxy | null
}

export const PDFRenderer = forwardRef<PDFRendererHandle, PDFRendererProps>(
  function PDFRenderer(
    {
      file,
      scale,
      onDocumentLoaded,
      onDocumentProxy,
      onVisiblePageChange,
      onAllPagesReady,
      citations = [],
      activeCitationId,
      highlightColor,
      activeHighlightColor,
      className,
      style,
    },
    ref,
  ) {
    const t = useTheme()

    const containerRef = useRef<HTMLDivElement>(null)
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())
    const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
    const pageProxies = useRef<Map<number, PDFPageProxy>>(new Map())
    const docRef = useRef<PDFDocumentProxy | null>(null)
    const observerRef = useRef<IntersectionObserver | null>(null)
    const isRenderingRef = useRef<Set<number>>(new Set())

    const [totalPages, setTotalPages] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set())
    const [renderedPageProxies, setRenderedPageProxies] = useState<
      Map<number, PDFPageProxy>
    >(new Map())
    const [pageDimensions, setPageDimensions] = useState<
      Map<number, { width: number; height: number }>
    >(new Map())

    useImperativeHandle(ref, () => ({
      scrollToPage: (page: number) => {
        const el = pageRefs.current.get(page)
        if (el && containerRef.current) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      },
      getPageProxy: (page: number) => pageProxies.current.get(page) ?? null,
    }))

    const renderPage = useCallback(
      async (pageNum: number) => {
        const doc = docRef.current
        if (!doc) return
        if (isRenderingRef.current.has(pageNum)) return
        isRenderingRef.current.add(pageNum)

        try {
          const page = await doc.getPage(pageNum)
          const viewport = page.getViewport({ scale })
          const canvas = canvasRefs.current.get(pageNum)
          if (!canvas) {
            isRenderingRef.current.delete(pageNum)
            requestAnimationFrame(() => renderPage(pageNum))
            return
          }

          canvas.width = viewport.width
          canvas.height = viewport.height

          await page.render({ canvas, viewport }).promise

          pageProxies.current.set(pageNum, page)

          setRenderedPageProxies((prev) => {
            const next = new Map(prev)
            next.set(pageNum, page)
            return next
          })

          setLoadedPages((prev) => {
            const next = new Set(prev)
            next.add(pageNum)
            return next
          })

          if (pageProxies.current.size === totalPages && totalPages > 0) {
            onAllPagesReady?.(new Map(pageProxies.current))
          }
        } catch (err) {
          console.error(`[CitePDF] Error rendering page ${pageNum}:`, err)
        } finally {
          isRenderingRef.current.delete(pageNum)
        }
      },
      [scale, totalPages, onAllPagesReady],
    )

    // Load document
    useEffect(() => {
      let cancelled = false

      async function loadDoc() {
        setError(null)
        setLoadedPages(new Set())
        setRenderedPageProxies(new Map())
        pageProxies.current.clear()

        try {
          const pdf = await pdfjsLib.getDocument(file).promise
          if (cancelled) return

          docRef.current = pdf
          setTotalPages(pdf.numPages)
          onDocumentLoaded(pdf.numPages)
          onDocumentProxy?.(pdf)

          const dims = new Map<number, { width: number; height: number }>()
          for (let i = 1; i <= pdf.numPages; i++) {
            const p = await pdf.getPage(i)
            const vp = p.getViewport({ scale })
            dims.set(i, { width: vp.width, height: vp.height })
          }
          if (!cancelled) setPageDimensions(dims)
        } catch (err) {
          if (!cancelled) {
            const message = err instanceof Error ? err.message : String(err)
            setError(`Failed to load PDF — ${message}`)
          }
        }
      }

      loadDoc()
      return () => {
        cancelled = true
      }
    }, [file])

    useEffect(() => {
      if (!docRef.current || totalPages === 0) return

      async function recomputeDims() {
        const doc = docRef.current!
        const dims = new Map<number, { width: number; height: number }>()
        for (let i = 1; i <= totalPages; i++) {
          const p = await doc.getPage(i)
          const vp = p.getViewport({ scale })
          dims.set(i, { width: vp.width, height: vp.height })
        }
        setPageDimensions(dims)

        loadedPages.forEach((pageNum) => {
          isRenderingRef.current.delete(pageNum)
          renderPage(pageNum)
        })
      }

      recomputeDims()
    }, [scale])

    useEffect(() => {
      if (totalPages === 0) return

      observerRef.current?.disconnect()

      const pageRatios = new Map<number, number>()

      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const pageNum = parseInt(
              (entry.target as HTMLDivElement).dataset.page ?? '0',
            )
            if (!pageNum) return

            if (entry.isIntersecting) {
              pageRatios.set(pageNum, entry.intersectionRatio)
              if (!loadedPages.has(pageNum)) {
                renderPage(pageNum)
              }
            } else {
              pageRatios.delete(pageNum)
            }
          })

          if (pageRatios.size > 0) {
            let topPage = -1
            let topRatio = -1
            pageRatios.forEach((ratio, page) => {
              if (ratio > topRatio) {
                topRatio = ratio
                topPage = page
              }
            })
            if (topPage !== -1) {
              onVisiblePageChange?.(topPage)
            }
          }
        },
        {
          root: containerRef.current,
          rootMargin: '200px 0px',
          threshold: Array.from({ length: 11 }, (_, i) => i / 10), // [0, 0.1, 0.2, ... 1.0]
        },
      )

      pageRefs.current.forEach((el) => {
        observerRef.current?.observe(el)
      })

      return () => observerRef.current?.disconnect()
    }, [totalPages, loadedPages, renderPage, onVisiblePageChange])

    if (error) {
      return (
        <div
          style={{ padding: '2rem', color: t.errorText, fontSize: '0.875rem' }}
        >
          <strong>PDF load error</strong>
          <br />
          <code style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
            {error}
          </code>
        </div>
      )
    }

    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          backgroundColor: t.pdfAreaBg,
          transition: 'background-color 0.2s ease',
          ...style,
        }}
      >
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
          const dims = pageDimensions.get(pageNum)
          const isLoaded = loadedPages.has(pageNum)
          const pageProxy = renderedPageProxies.get(pageNum) ?? null

          return (
            <div
              key={pageNum}
              data-page={pageNum}
              ref={(el) => {
                if (el) pageRefs.current.set(pageNum, el)
                else pageRefs.current.delete(pageNum)
              }}
              style={{
                position: 'relative',
                boxShadow: t.pageShadow,
                lineHeight: 0,
                flexShrink: 0,
                width: dims?.width ?? 'auto',
                height: dims?.height ?? 'auto',
              }}
            >
              {!isLoaded && dims && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: dims.width,
                    height: dims.height,
                    backgroundColor: t.pagePlaceholderBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: t.pagePlaceholderText,
                    fontSize: '0.85rem',
                  }}
                >
                  Loading page {pageNum}…
                </div>
              )}

              <canvas
                ref={(el) => {
                  if (el) canvasRefs.current.set(pageNum, el)
                  else canvasRefs.current.delete(pageNum)
                }}
                style={{
                  display: 'block',
                  visibility: isLoaded ? 'visible' : 'hidden',
                }}
              />

              {isLoaded && pageProxy && (
                <HighlightOverlay
                  citations={citations}
                  currentPage={pageNum}
                  scale={scale}
                  activeCitationId={activeCitationId}
                  page={pageProxy}
                  highlightColor={highlightColor}
                  activeHighlightColor={activeHighlightColor}
                />
              )}
            </div>
          )
        })}
      </div>
    )
  },
)
