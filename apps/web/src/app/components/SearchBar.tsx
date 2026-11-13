'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { Search, X, BookOpen, User, ArrowLeft } from 'lucide-react'
import { learnUrlWithToken } from '../../lib/learn-link'
import { getMediaUrl } from '../../lib/media'
import { formatCoursePrice, getCountryClient } from '../../lib/market'

interface SearchResult {
  courses: { id: string; title: string; titleAr?: string; thumbnail?: string; price: number; priceDisplay?: string | null }[]
  consultants: { id: string; speciality: string; profile?: { firstName: string; lastName: string } }[]
}

export function SearchBar() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const requestRef = useRef(0)

  // Same base-URL rule as lib/api.ts. An empty fallback made the request go to the
  // web app's own origin (/courses/search -> 404), so results never appeared.
  const API = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim()
    ? process.env.NEXT_PUBLIC_API_URL.trim()
    : 'https://api.deveways.com/api'
  ).replace(/\/+$/, '')

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Keyboard shortcut: /
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Debounced search
  const doSearch = useCallback((raw: string) => {
    clearTimeout(timerRef.current)
    const q = raw.trim()
    // Any pending/in-flight request is now stale
    const requestId = ++requestRef.current
    setFailed(false)
    if (q.length < 2) { setResults(null); setLoading(false); return }
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const countryParam = getCountryClient() === 'EG' ? '&country=EG' : ''
        const res = await fetch(`${API}/courses/search?q=${encodeURIComponent(q)}${countryParam}`)
        if (!res.ok) throw new Error(`search failed: ${res.status}`)
        const data = await res.json()
        if (requestId !== requestRef.current) return // a newer search superseded this one
        setResults(data?.data ?? { courses: [], consultants: [] })
      } catch {
        if (requestId !== requestRef.current) return
        setResults(null)
        setFailed(true)
      } finally {
        if (requestId === requestRef.current) setLoading(false)
      }
    }, 300)
  }, [API])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    doSearch(e.target.value)
  }

  const clear = () => { clearTimeout(timerRef.current); requestRef.current++; setQuery(''); setResults(null); setFailed(false); setLoading(false); inputRef.current?.focus() }

  const trimmed = query.trim()
  const hasResults = results && (
    (results.courses?.length || 0) + (results.consultants?.length || 0) > 0
  )

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>

      {/* ── Trigger button ── */}
      <button
        onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50) }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--surface-2)',
          border: `1px solid ${open ? 'color-mix(in srgb, var(--primary) 50%, transparent)' : 'var(--border)'}`,
          borderRadius: 10,
          padding: '7px 12px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          minWidth: 160,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'color-mix(in srgb, var(--primary) 40%, transparent)'
        }}
        onMouseLeave={e => {
          if (!open)
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
        }}
      >
        <Search size={14} style={{ color: 'var(--muted)' }} strokeWidth={2} />
        <span style={{
          fontSize: 13,
          color: 'var(--muted)',
          fontFamily: 'DM Sans, sans-serif',
          flex: 1,
          textAlign: isAr ? 'right' : 'left',
        }}>
          {isAr ? 'ابحث...' : 'Search...'}
        </span>
        <kbd style={{
          fontSize: 10,
          color: 'var(--muted)',
          background: 'var(--surface-3)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          padding: '1px 5px',
          fontFamily: 'monospace',
        }}>
          /
        </kbd>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          [isAr ? 'right' : 'left']: 0,
          width: 360,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: 'var(--shadow-xl)',
          overflow: 'hidden',
          zIndex: 9999,
        }}>

          {/* Search input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderBottom: '1px solid var(--border)',
          }}>
            {loading ? (
              <div style={{
                width: 16, height: 16,
                border: '2px solid color-mix(in srgb, var(--primary) 30%, transparent)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'dw-spin 0.6s linear infinite',
                flexShrink: 0,
              }} />
            ) : (
              <Search size={16} color="var(--muted-foreground)" strokeWidth={2} style={{ flexShrink: 0 }} />
            )}

            <input
              ref={inputRef}
              value={query}
              onChange={handleChange}
              placeholder={isAr ? 'ابحث عن كورس أو مرشد...' : 'Search courses, mentors...'}
              autoFocus
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--foreground)',
                fontSize: 14,
                fontFamily: 'DM Sans, sans-serif',
                direction: isAr ? 'rtl' : 'ltr',
              }}
            />

            {query && (
              <button onClick={clear} style={{
                background: 'none', border: 'none',
                cursor: 'pointer', padding: 2,
                color: 'var(--muted-foreground)',
                display: 'flex', alignItems: 'center',
              }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Results */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {trimmed.length < 2 ? (
              /* Hint: the API needs at least 2 characters */
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <Search size={28} color="var(--muted-foreground)" style={{ margin: '0 auto 8px' }} />
                <p style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                  {trimmed.length === 1
                    ? (isAr ? 'اكتب حرفين على الأقل...' : 'Type at least 2 characters...')
                    : (isAr ? 'اكتب للبحث...' : 'Type to search...')}
                </p>
              </div>
            ) : loading && !hasResults ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                  {isAr ? 'جاري البحث...' : 'Searching...'}
                </p>
              </div>
            ) : failed ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p style={{ color: 'var(--error)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                  {isAr ? 'تعذر إكمال البحث. حاول مرة أخرى.' : 'Search failed. Please try again.'}
                </p>
              </div>
            ) : !hasResults ? (
              /* No results */
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                  {isAr ? `لا نتائج لـ "${trimmed}"` : `No results for "${trimmed}"`}
                </p>
              </div>
            ) : (
              <>
                {/* Courses */}
                {(results?.courses?.length || 0) > 0 && (
                  <div>
                    <div style={{
                      padding: '8px 16px 4px',
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'var(--muted)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                      {isAr ? 'الكورسات' : 'Courses'}
                    </div>
                    {results!.courses.map(course => (
                      <a
                        key={course.id}
                        href={learnUrlWithToken(`/${locale}/courses/${course.id}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 16px',
                          textDecoration: 'none',
                          transition: 'background 0.1s ease',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'color-mix(in srgb, var(--foreground) 5%, transparent)'}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
                      >
                        <div style={{
                          width: 36, height: 36,
                          borderRadius: 8,
                          background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}>
                          {course.thumbnail ? (
                            <img
                              src={getMediaUrl(course.thumbnail) ?? ''}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                              alt=""
                            />
                          ) : (
                            <BookOpen size={16} color="var(--primary)" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            color: 'var(--foreground)',
                            fontSize: 13,
                            fontWeight: 500,
                            margin: 0,
                            fontFamily: 'DM Sans, sans-serif',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {isAr ? (course.titleAr || course.title) : course.title}
                          </p>
                          <p style={{
                            color: 'var(--primary)',
                            fontSize: 12,
                            margin: 0,
                            fontFamily: 'DM Sans, sans-serif',
                          }}>
                            {formatCoursePrice(course)}
                          </p>
                        </div>
                        <ArrowLeft size={14} color="var(--muted-foreground)" style={{ transform: isAr ? 'none' : 'rotate(180deg)', flexShrink: 0 }} />
                      </a>
                    ))}
                  </div>
                )}

                {/* Consultants */}
                {(results?.consultants?.length || 0) > 0 && (
                  <div>
                    <div style={{
                      padding: '8px 16px 4px',
                      fontSize: 10,
                      fontWeight: 500,
                      color: 'var(--muted)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontFamily: 'DM Sans, sans-serif',
                      borderTop: (results?.courses?.length || 0) > 0
                        ? '1px solid var(--border)' : 'none',
                      marginTop: (results?.courses?.length || 0) > 0 ? 4 : 0,
                    }}>
                      {isAr ? 'المرشدون' : 'Mentors'}
                    </div>
                    {results!.consultants.map(c => (
                      <a
                        key={c.id}
                        href={`/${locale}/coaching`}
                        onClick={() => setOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '10px 16px',
                          textDecoration: 'none',
                          transition: 'background 0.1s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'color-mix(in srgb, var(--foreground) 5%, transparent)'}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
                      >
                        <div style={{
                          width: 36, height: 36,
                          borderRadius: '50%',
                          background: 'color-mix(in srgb, var(--teal) 15%, transparent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <User size={16} color="var(--teal)" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{
                            color: 'var(--foreground)', fontSize: 13, fontWeight: 500,
                            margin: 0, fontFamily: 'DM Sans, sans-serif',
                          }}>
                            {c.profile?.firstName} {c.profile?.lastName}
                          </p>
                          <p style={{
                            color: 'var(--muted)', fontSize: 12,
                            margin: 0, fontFamily: 'DM Sans, sans-serif',
                          }}>
                            {c.speciality}
                          </p>
                        </div>
                        <ArrowLeft size={14} color="var(--muted-foreground)" style={{ transform: isAr ? 'none' : 'rotate(180deg)', flexShrink: 0 }} />
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
              {isAr ? 'اضغط Esc للإغلاق' : 'Esc to close'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
              {isAr ? '/ للفتح' : '/ to open'}
            </span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dw-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
