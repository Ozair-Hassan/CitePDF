import { useState, useRef } from 'react'
import { useTheme } from '../utils/theme'
import type { NavigationBarProps } from '../types'

export function NavigationBar({
  currentPage,
  totalPages,
  scale,
  onPageChange,
  onScaleChange,
  className,
  style,
}: NavigationBarProps) {
  const t = useTheme()

  const [inputValue, setInputValue] = useState('')
  const [editing, setEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handlePageInputFocus = () => {
    setEditing(true)
    setInputValue(String(currentPage))
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handlePageInputBlur = () => {
    setEditing(false)
    const parsed = parseInt(inputValue, 10)
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed)
    }
  }

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') inputRef.current?.blur()
    if (e.key === 'Escape') {
      setEditing(false)
      setInputValue('')
      inputRef.current?.blur()
    }
  }

  const btnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: `1px solid ${t.navBarButtonBorder}`,
    background: t.navBarButtonBg,
    color: t.navBarButtonText,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    flexShrink: 0,
    padding: 0,
  }

  const btnDisabled: React.CSSProperties = {
    opacity: 0.35,
    cursor: 'not-allowed',
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        borderBottom: `1px solid ${t.navBarBorder}`,
        backgroundColor: t.navBarBg,
        flexShrink: 0,
        height: '48px',
        boxShadow: t.navBarShadow,
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.82rem',
          color: t.navBarTextMuted,
          fontFamily: 'ui-monospace, SFMono-Regular, monospace',
          letterSpacing: '0.02em',
        }}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={editing ? inputValue : currentPage}
          onFocus={handlePageInputFocus}
          onBlur={handlePageInputBlur}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handlePageInputKeyDown}
          style={{
            width: '3rem',
            padding: '4px 8px',
            border: '1px solid',
            borderColor: editing
              ? t.navBarInputBorderActive
              : t.navBarInputBorder,
            borderRadius: '6px',
            textAlign: 'center',
            background: editing ? t.navBarInputBgActive : t.navBarInputBg,
            color: t.navBarInputText,
            fontSize: '0.85rem',
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'border-color 0.15s, background 0.15s',
            boxShadow: editing ? t.navBarInputGlow : 'none',
            lineHeight: '1.5',
          }}
        />
        <span style={{ color: t.navBarTextSoft }}>/</span>
        <span style={{ color: t.navBarTextStrong, fontWeight: 500 }}>
          {totalPages}
        </span>
      </div>

      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
        }}
      >
        <button
          onClick={() => onScaleChange(Math.max(0.5, scale - 0.25))}
          disabled={scale <= 0.5}
          title="Zoom out"
          style={{ ...btnBase, ...(scale <= 0.5 ? btnDisabled : {}) }}
          onMouseEnter={(e) => {
            if (scale > 0.5)
              e.currentTarget.style.background = t.navBarButtonBgHover
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = t.navBarButtonBg
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle
              cx="7"
              cy="7"
              r="4.25"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M5.5 7h3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M10.5 10.5L13 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Scale label */}
        <span
          style={{
            fontSize: '0.78rem',
            color: t.navBarTextMuted,
            minWidth: '3rem',
            textAlign: 'center',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            fontWeight: 500,
          }}
        >
          {Math.round(scale * 100)}%
        </span>

        {/* Zoom in */}
        <button
          onClick={() => onScaleChange(Math.min(3, scale + 0.25))}
          disabled={scale >= 3}
          title="Zoom in"
          style={{ ...btnBase, ...(scale >= 3 ? btnDisabled : {}) }}
          onMouseEnter={(e) => {
            if (scale < 3)
              e.currentTarget.style.background = t.navBarButtonBgHover
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = t.navBarButtonBg
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle
              cx="7"
              cy="7"
              r="4.25"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M7 5v4M5 7h4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M10.5 10.5L13 13"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
