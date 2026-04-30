'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { Search, X, BookOpen, User, ArrowLeft } from 'lucide-react'

interface SearchResult {
  courses: { id: string; title: string; titleAr?: string; thumbnail?: string; price: number }[]
  consultants: { id: string; speciality: string; profile?: { firstName: string; lastName: string } }[]
}

export function SearchBar() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const API = process.env.NEXT_PUBLIC_API_URL || 'https://deve-way.onrender.com/api'

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
  const doSearch = useCallback((q: string) => {
    clearTimeout(timerRef.current)
    if (q.length < 2) { setResults(null); return }
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/courses/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setResults(data?.data ?? null)
      } catch { setResults(null) }
      finally { setLoading(false) }
    }, 300)
  }, [API])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    doSearch(e.target.value)
  }

  const clear = () => { setQuery(''); setResults(null); inputRef.current?.focus() }

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
          background: open ? '#1A1A1A' : '#0D0D0D',
          border: `1px solid ${open ? 'rgba(81,32,200,0.5)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 10,
          padding: '7px 12px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          outline: 'none',
          minWidth: 160,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(81,32,200,0.4)'
        }}
        onMouseLeave={e => {
          if (!open)
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)'
        }}
      >
        <Search size={14} color="rgba(255,255,255,0.35)" strokeWidth={2} />
        <span style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'DM Sans, sans-serif',
          flex: 1,
          textAlign: isAr ? 'right' : 'left',
        }}>
          {isAr ? 'ابحث...' : 'Search...'}
        </span>
        <kbd style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
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
          background: '#0D0D0D',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 14,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          zIndex: 9999,
        }}>

          {/* Search input */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}>
            {loading ? (
              <div style={{
                width: 16, height: 16,
                border: '2px solid rgba(81,32,200,0.3)',
                borderTopColor: '#5120c8',
                borderRadius: '50%',
                animation: 'dw-spin 0.6s linear infinite',
                flexShrink: 0,
              }} />
            ) : (
              <Search size={16} color="rgba(255,255,255,0.3)" strokeWidth={2} style={{ flexShrink: 0 }} />
            )}

            <input
              ref={inputRef}
              value={query}
              onChange={handleChange}
              placeholder={isAr ? 'ابحث عن كورس أو مستشار...' : 'Search courses, consultants...'}
              autoFocus
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#F8F8FA',
                fontSize: 14,
                fontFamily: 'DM Sans, sans-serif',
                direction: isAr ? 'rtl' : 'ltr',
              }}
            />

            {query && (
              <button onClick={clear} style={{
                background: 'none', border: 'none',
                cursor: 'pointer', padding: 2,
                color: 'rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center',
              }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Results */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {!query || query.length < 2 ? (
              /* Empty state */
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <Search size={28} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 8px' }} />
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                  {isAr ? 'اكتب للبحث...' : 'Type to search...'}
                </p>
              </div>
            ) : !hasResults && !loading ? (
              /* No results */
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontFamily: 'DM Sans, sans-serif', margin: 0 }}>
                  {isAr ? `لا نتائج لـ "${query}"` : `No results for "${query}"`}
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
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.25)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontFamily: 'DM Sans, sans-serif',
                    }}>
                      {isAr ? 'الكورسات' : 'Courses'}
                    </div>
                    {results!.courses.map(course => (
                      <a
                        key={course.id}
                        href={`/${locale}/courses/${course.id}`}
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
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
                      >
                        <div style={{
                          width: 36, height: 36,
                          borderRadius: 8,
                          background: 'rgba(81,32,200,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                          overflow: 'hidden',
                        }}>
                          {course.thumbnail ? (
                            <img
                              src={`${API}${course.thumbnail}`}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                              alt=""
                            />
                          ) : (
                            <BookOpen size={16} color="rgba(81,32,200,0.6)" />
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            color: '#F8F8FA',
                            fontSize: 13,
                            fontWeight: 600,
                            margin: 0,
                            fontFamily: 'DM Sans, sans-serif',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {isAr ? (course.titleAr || course.title) : course.title}
                          </p>
                          <p style={{
                            color: '#5120c8',
                            fontSize: 12,
                            margin: 0,
                            fontFamily: 'DM Sans, sans-serif',
                          }}>
                            {course.price > 0 ? `${course.price} SAR` : (isAr ? 'مجاني' : 'Free')}
                          </p>
                        </div>
                        <ArrowLeft size={14} color="rgba(255,255,255,0.2)" />
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
                      fontWeight: 700,
                      color: 'rgba(255,255,255,0.25)',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontFamily: 'DM Sans, sans-serif',
                      borderTop: (results?.courses?.length || 0) > 0
                        ? '1px solid rgba(255,255,255,0.06)' : 'none',
                      marginTop: (results?.courses?.length || 0) > 0 ? 4 : 0,
                    }}>
                      {isAr ? 'المستشارون' : 'Consultants'}
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
                        onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'}
                      >
                        <div style={{
                          width: 36, height: 36,
                          borderRadius: '50%',
                          background: 'rgba(43,191,163,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <User size={16} color="rgba(43,191,163,0.7)" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{
                            color: '#F8F8FA', fontSize: 13, fontWeight: 600,
                            margin: 0, fontFamily: 'DM Sans, sans-serif',
                          }}>
                            {c.profile?.firstName} {c.profile?.lastName}
                          </p>
                          <p style={{
                            color: 'rgba(255,255,255,0.35)', fontSize: 12,
                            margin: 0, fontFamily: 'DM Sans, sans-serif',
                          }}>
                            {c.speciality}
                          </p>
                        </div>
                        <ArrowLeft size={14} color="rgba(255,255,255,0.2)" />
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
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'DM Sans, sans-serif' }}>
              {isAr ? 'اضغط Esc للإغلاق' : 'Esc to close'}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'DM Sans, sans-serif' }}>
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
