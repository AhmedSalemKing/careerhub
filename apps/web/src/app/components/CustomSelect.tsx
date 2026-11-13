'use client'

import { useEffect, useId, useRef, useState } from 'react'

export interface SelectOption { value: string; label: string }

/**
 * Themed replacement for the native <select>. The list is positioned with `fixed` from the trigger's
 * rectangle, so it is never clipped by a scrolling parent such as a modal body.
 */
export function CustomSelect({
  value, onChange, options, placeholder, disabled, ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  ariaLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<{ top: number; left: number; width: number; up: boolean } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const id = useId()
  const current = options.find((o) => o.value === value)

  const toggle = () => {
    if (disabled) return
    if (open) return setOpen(false)
    const r = triggerRef.current?.getBoundingClientRect()
    if (r) {
      const room = window.innerHeight - r.bottom
      const up = room < 200 && r.top > room
      setRect({ top: up ? r.top : r.bottom, left: r.left, width: r.width, up })
    }
    setOpen(true)
  }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    // Scrolling the option list itself must not close it (that was the "dropdown disappears" bug)
    const onScroll = (e: Event) => { if (!listRef.current?.contains(e.target as Node)) close() }
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !listRef.current?.contains(t)) close()
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); close() } }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown as any, { passive: true })
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown as any)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  return (
    <div className="cs">
      <button
        type="button"
        ref={triggerRef}
        className={'cs-trigger' + (open ? ' open' : '')}
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-label={ariaLabel}
      >
        <span className={current ? '' : 'cs-ph'}>{current?.label || placeholder || ''}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && rect && (
        <div
          id={id}
          ref={listRef}
          role="listbox"
          className="cs-list"
          onMouseDown={(e) => e.stopPropagation()}
          style={{ left: rect.left, width: rect.width, ...(rect.up ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.top + 4 }) }}
        >
          {options.map((o) => (
            <div
              key={o.value || '__empty'}
              role="option"
              aria-selected={o.value === value}
              className={'cs-opt' + (o.value === value ? ' on' : '')}
              onMouseDown={(e) => { e.preventDefault(); onChange(o.value); setOpen(false) }}
              onClick={() => { onChange(o.value); setOpen(false) }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
