import { useTheme } from '../utils/theme'
import type { CitationSidebarProps } from '../types'

export function CitationSidebar({
  citations,
  activeCitationId,
  failedCitationIds = new Set(),
  onCitationClick,
  className,
  style,
}: CitationSidebarProps) {
  const t = useTheme()

  if (citations.length === 0) return null

  return (
    <div
      className={className}
      style={{
        width: '240px',
        borderLeft: `1px solid ${t.sidebarBorder}`,
        overflowY: 'auto',
        backgroundColor: t.sidebarBg,
        padding: '0.75rem',
        flexShrink: 0,
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
        ...style,
      }}
    >
      <h3
        style={{
          margin: '0 0 0.75rem 0',
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: t.sidebarHeading,
        }}
      >
        Citations
      </h3>

      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
        }}
      >
        {citations.map((citation) => {
          const isActive = activeCitationId === citation.id
          const isFailed = failedCitationIds.has(citation.id)

          const bg = isFailed
            ? t.sidebarItemBgFailed
            : isActive
              ? t.sidebarItemBgActive
              : t.sidebarItemBg

          const borderColor = isFailed
            ? t.sidebarItemBorderFailed
            : isActive
              ? t.sidebarItemBorderActive
              : t.sidebarItemBorder

          const textColor = isFailed
            ? t.sidebarItemTextFailed
            : isActive
              ? t.sidebarItemTextActive
              : t.sidebarItemText

          const metaColor = isFailed
            ? t.sidebarItemTextMetaFailed
            : t.sidebarItemTextMeta

          return (
            <li
              key={citation.id}
              onClick={() => onCitationClick(citation.id)}
              style={{
                padding: '0.6rem 0.75rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                backgroundColor: bg,
                border: `1px solid ${borderColor}`,
                color: textColor,
                transition:
                  'background-color 0.15s, border-color 0.15s, color 0.15s',
              }}
            >
              <div style={{ fontWeight: 500 }}>{citation.label}</div>
              <div
                style={{
                  fontSize: '0.75rem',
                  marginTop: '0.2rem',
                  color: metaColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                {isFailed ? (
                  <>
                    <span style={{ lineHeight: 1 }}>⚠</span>
                    Match not found
                  </>
                ) : citation.page ? (
                  `Page ${citation.page}`
                ) : (
                  'Page —'
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
