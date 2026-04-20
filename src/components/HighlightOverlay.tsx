import { useEffect, useState } from 'react'
import { useTheme } from '../utils/theme'
import type { BoundingBox, HighlightOverlayProps } from '../types'
import { findTextPosition } from '../utils/findTextPosition'

export function HighlightOverlay({
  citations,
  currentPage,
  scale,
  activeCitationId,
  page,
  onUnmatched,
  highlightColor,
  activeHighlightColor,
}: HighlightOverlayProps & { onUnmatched?: (ids: number[]) => void }) {
  const t = useTheme()
  const effectiveHighlight = highlightColor ?? t.highlightDefault
  const effectiveActiveHighlight = activeHighlightColor ?? t.highlightActive

  const [positions, setPositions] = useState<Map<number, BoundingBox[]>>(
    new Map(),
  )

  useEffect(() => {
    if (!page) {
      setPositions(new Map())
      return
    }

    const pageCitations = citations.filter((c) => c.page === currentPage)
    if (pageCitations.length === 0) {
      setPositions(new Map())
      return
    }

    let cancelled = false

    async function resolveAll() {
      const map = new Map<number, BoundingBox[]>()
      const unmatched: number[] = []

      await Promise.all(
        pageCitations.map(async (citation) => {
          const boxes = await findTextPosition(page!, citation.text)
          if (boxes.length > 0 && !cancelled) {
            map.set(citation.id, boxes)
          } else if (!cancelled) {
            unmatched.push(citation.id)
          }
        }),
      )

      if (!cancelled) {
        setPositions(map)
        if (unmatched.length > 0) onUnmatched?.(unmatched)
      }
    }

    resolveAll()
    return () => {
      cancelled = true
    }
  }, [page, citations, currentPage])

  if (positions.size === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
      }}
    >
      {Array.from(positions.entries()).map(([id, boxes]) => {
        const isActive = activeCitationId === id
        const color = isActive ? effectiveActiveHighlight : effectiveHighlight

        return boxes.map((box, lineIdx) => (
          <div
            key={`${id}-${lineIdx}`}
            style={{
              position: 'absolute',
              left: box.x * scale,
              top: box.y * scale,
              width: box.width * scale,
              height: box.height * scale,
              backgroundColor: color,
              mixBlendMode: 'multiply',
              transition: 'background-color 0.2s',
            }}
          />
        ))
      })}
    </div>
  )
}
