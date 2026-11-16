'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface SelectOption {
  value: string
  label: string
  /** Optional group heading; consecutive options sharing a group are listed under one heading (like <optgroup>). */
  group?: string
}

/**
 * Themed replacement for the native <select>. The list is rendered in a portal on document.body and positioned
 * with `fixed` from the trigger's rectangle. That keeps it clear of any ancestor `overflow` clipping and of
 * `transform`ed ancestors (animated modals), which would otherwise turn `fixed` into a clipped, offset box.
 *
 * `placeholder` is shown while `value` matches no option. An option with value '' is a real, selectable
 * option (use it for "All" filters); leave it out for required fields and rely on `placeholder`.
 */
export function CustomSelect({
  value, onChange, options, placeholder, disabled, required, ariaLabel, compact, className, style, searchable = true,
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
  /** Show a type-to-filter box at the top of the list. Defaults to true. */
  searchable?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [rect, setRect] = useState<{ top: number; left: number; width: number; up: boolean } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [search, setSearch] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const headRef = useRef<HTMLDivElement>(null)
  const id = useId()
  const current = options.find((o) => o.value === value)
  // Filtered view of the options (group headings follow because they derive from each option's `group`)
  const needle = search.trim().toLowerCase()
  const filtered = needle ? options.filter((o) => o.label.toLowerCase().includes(needle)) : options
  const isAr = typeof document !== 'undefined' && (document.documentElement.lang || '').toLowerCase().startsWith('ar')

  // Anchor the list to the trigger. Returns false when the trigger is scrolled out of the viewport.
  const place = () => {
    const r = triggerRef.current?.getBoundingClientRect()
    if (!r) return true
    const room = window.innerHeight - r.bottom
    const up = room < 200 && r.top > room
    setRect({ top: up ? r.top : r.bottom, left: r.left, width: r.width, up })
    return r.bottom > 0 && r.top < window.innerHeight
  }

  const openList = () => {
    place()
    setSearch('')
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
    // Scrolling the option list itself must not close it. Any other scroll (page, modal body, an unrelated
    // carousel) just re-anchors the list; it only closes once the trigger itself has left the viewport.
    const onScroll = (e: Event) => {
      if (listRef.current?.contains(e.target as Node)) return
      if (!place()) close()
    }
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !listRef.current?.contains(t)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); close() }
      else if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
      // Space must stay typeable inside the search box
      else if (e.key === 'Enter' || (e.key === ' ' && e.target !== searchRef.current)) {
        const o = filtered[active]
        if (o) { e.preventDefault(); onChange(o.value); close() }
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown as any, { passive: true })
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown as any)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [open, active, filtered, onChange])

  // focus the search box as soon as the list is mounted (without scrolling any ancestor)
  useEffect(() => {
    if (open && searchable) searchRef.current?.focus({ preventScroll: true })
  }, [open, searchable, rect !== null])

  // keep the highlighted option in view while using the keyboard (the sticky search box covers the top edge)
  useEffect(() => {
    if (!open) return
    const list = listRef.current
    const el = list?.querySelector<HTMLElement>('[data-active="true"]')
    if (!list || !el) return
    const head = headRef.current?.offsetHeight ?? 0
    if (el.offsetTop - head < list.scrollTop) list.scrollTop = el.offsetTop - head
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight
  }, [open, active, search])

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
      {open && rect && createPortal(
        <div
          id={id}
          ref={listRef}
          role="listbox"
          className="cs-list"
          onMouseDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            zIndex: 2147483000,
            left: rect.left,
            width: rect.width,
            maxHeight: '220px',
            overflowY: 'scroll',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            ...(rect.up ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.top + 4 }),
          }}
        >
          {searchable && (
            <div className="cs-search" ref={headRef}>
              <input
                ref={searchRef}
                type="text"
                value={search}
                autoComplete="off"
                aria-label={placeholder || (isAr ? 'بحث' : 'Search')}
                placeholder={placeholder ? (isAr ? `ابحث في ${placeholder}...` : `Search ${placeholder}...`) : (isAr ? 'ابحث...' : 'Search...')}
                onChange={(e) => { setSearch(e.target.value); setActive(0) }}
                onMouseDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          )}
          {filtered.length === 0 && (
            <div className="cs-empty">{isAr ? 'لا توجد نتائج' : 'No results'}</div>
          )}
          {filtered.map((o, i) => (
            <div key={(o.value || '__empty') + ':' + i}>
              {o.group && o.group !== filtered[i - 1]?.group && <div className="cs-group">{o.group}</div>}
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
        </div>,
        document.body,
      )}
    </div>
  )
}

export default CustomSelect
