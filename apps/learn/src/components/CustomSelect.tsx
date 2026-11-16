'use client'

import { useEffect, useId, useRef, useState } from 'react'

export interface SelectOption {
  value: string
  label: string
  /** Optional group heading; consecutive options sharing a group are listed under one heading (like <optgroup>). */
  group?: string
}

/**
 * Themed replacement for the native <select>. The list is positioned with `fixed` from the trigger's
 * rectangle, so it is never clipped by a scrolling parent such as a modal body.
 *
 * `placeholder` is shown while `value` matches no option. An option with value '' is a real, selectable
 * option (use it for "All" filters); leave it out for required fields and rely on `placeholder`.
 */
export function CustomSelect({
  value, onChange, options, placeholder, disabled, required, ariaLabel, compact, className, style,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  /** Blocks native form submission while no value is chosen. */
  required?: boolean
  ariaLabel?: string
  /** Smaller trigger for table cells. */
  compact?: boolean
  className?: string
  style?: React.CSSProperties
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [rect, setRect] = useState<{ top: number; left: number; width: number; up: boolean } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const id = useId()
  const current = options.find((o) => o.value === value)

  const openList = () => {
    const r = triggerRef.current?.getBoundingClientRect()
    if (r) {
      const room = window.innerHeight - r.bottom
      const up = room < 200 && r.top > room
      setRect({ top: up ? r.top : r.bottom, left: r.left, width: r.width, up })
    }
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }

  const toggle = () => {
    if (disabled) return
    if (open) return setOpen(false)
    openList()
  }

  const pick = (v: string) => { onChange(v); setOpen(false) }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    // Scrolling the option list itself must not close it (that was the "dropdown disappears" bug)
    const onScroll = (e: Event) => { if (!listRef.current?.contains(e.target as Node)) close() }
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !listRef.current?.contains(t)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); close() }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, options.length - 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
      else if (e.key === 'Enter' || e.key === ' ') {
        const o = options[active]
        if (o) { e.preventDefault(); onChange(o.value); close() }
      }
    }
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
  }, [open, active, options, onChange])

  // keep the highlighted option in view while using the keyboard
  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  return (
    <div className={'cs' + (className ? ' ' + className : '')} style={style}>
      <button
        type="button"
        ref={triggerRef}
        className={'cs-trigger' + (open ? ' open' : '') + (compact ? ' cs-sm' : '')}
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-label={ariaLabel}
        aria-required={required || undefined}
      >
        <span className={current ? 'cs-val' : 'cs-ph'}>{current?.label || placeholder || ''}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {required && (
        // invisible input so a surrounding <form> refuses to submit while nothing is chosen
        <input
          tabIndex={-1}
          required
          value={value}
          onChange={() => {}}
          aria-hidden="true"
          style={{ position: 'absolute', left: 0, bottom: 0, width: '100%', height: 1, opacity: 0, pointerEvents: 'none' }}
        />
      )}
      {open && rect && (
        <div
          id={id}
          ref={listRef}
          role="listbox"
          className="cs-list"
          onMouseDown={(e) => e.stopPropagation()}
          style={{ left: rect.left, width: rect.width, ...(rect.up ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.top + 4 }) }}
        >
          {options.map((o, i) => (
            <div key={(o.value || '__empty') + ':' + i}>
              {o.group && o.group !== options[i - 1]?.group && <div className="cs-group">{o.group}</div>}
              <div
                role="option"
                aria-selected={o.value === value}
                data-active={i === active}
                className={'cs-opt' + (o.value === value ? ' on' : '') + (i === active ? ' act' : '')}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); pick(o.value) }}
              >
                {o.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CustomSelect
