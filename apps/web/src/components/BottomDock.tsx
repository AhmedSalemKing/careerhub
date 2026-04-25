'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, LogOut } from 'lucide-react'

interface DockItem {
  icon: any
  labelAr: string
  labelEn: string
  href: string
}

interface BottomDockProps {
  items: DockItem[]
  onLogout?: () => void
  position?: 'top' | 'bottom'
}

export default function BottomDock({ items, onLogout, position = 'bottom' }: BottomDockProps) {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false) // for responsive collapse
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const locale = pathname.split('/')[1] || 'ar'
  const isRTL = locale === 'ar'

  useEffect(() => {
    setMounted(true)
    const t = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(t)
  }, [])

  const getScale = (index: number) => {
    if (hoveredIndex === null) return 1
    const distance = Math.abs(index - hoveredIndex)
    if (distance === 0) return 1.2
    if (distance === 1) return 1.08
    if (distance === 2) return 1.04
    return 1
  }

  const isDark = theme === 'dark'

  const dockStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    transform: visible ? 'translateX(-50%)' : `translateX(-50%) translateY(${position === 'bottom' ? '80px' : '-80px'})`,
    opacity: visible ? 1 : 0,
    transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.6s ease',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    padding: '8px 12px',
    borderRadius: '20px',
    background: isDark ? 'rgba(15,18,33,0.9)' : 'rgba(255,255,255,0.92)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
    boxShadow: isDark
      ? '0 8px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)'
      : '0 8px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.05)',
    ...(position === 'bottom' ? { bottom: '20px' } : { top: '12px' }),
  }

  return (
    <>
      {/* RESPONSIVE: small icon button to expand on mobile - hidden on desktop (lg+) */}
      <div
        className="fixed lg:flex z-[9998] hidden"
        style={{
          ...(position === 'bottom' ? { bottom: '24px', right: '16px' } : { top: '16px', right: '16px' }),
        }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: '#5120c8',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(81,32,200,0.4)',
            color: '#fff',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {expanded
              ? <path d="M18 6L6 18M6 6l12 12"/>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </div>

      {/* MAIN DOCK - hidden on desktop (lg+), show only on mobile */}
      <div
        className={`flex lg:hidden ${expanded ? '!flex' : ''}`}
        style={dockStyle}
      >
        {items.map((item, i) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const label = isRTL ? item.labelAr : item.labelEn

          return (
            <Link
              key={i}
              href={item.href}
              onClick={() => setExpanded(false)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 12px',
                borderRadius: '14px',
                cursor: 'pointer',
                textDecoration: 'none',
                transform: `scale(${getScale(i)})`,
                transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s ease',
                transitionDelay: visible ? `${i * 50}ms` : '0ms',
                background: isActive
                  ? isDark ? 'rgba(81,32,200,0.25)' : 'rgba(81,32,200,0.1)'
                  : hoveredIndex === i
                    ? isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
                    : 'transparent',
                minWidth: '56px',
              }}
            >
              <Icon
                size={20}
                style={{
                  color: isActive ? '#5120c8' : isDark ? 'rgba(255,255,255,0.65)' : 'rgba(13,13,13,0.55)',
                  transition: 'color 0.2s ease',
                }}
              />
              <span
                style={{
                  fontSize: '10px',
                  marginTop: '4px',
                  fontWeight: isActive ? '600' : '400',
                  color: isActive ? '#5120c8' : isDark ? 'rgba(255,255,255,0.55)' : 'rgba(13,13,13,0.5)',
                  whiteSpace: 'nowrap',
                  transition: 'color 0.2s ease',
                }}
              >
                {label}
              </span>
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: '#5120c8',
                }} />
              )}
            </Link>
          )
        })}

        {/* Divider */}
        <div style={{
          width: '1px', height: '36px', margin: '0 6px',
          background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
        }} />

        {/* Theme Toggle */}
        <button
          onMouseEnter={() => setHoveredIndex(items.length)}
          onMouseLeave={() => setHoveredIndex(null)}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '8px 12px', borderRadius: '14px',
            background: hoveredIndex === items.length
              ? isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
              : 'transparent',
            border: 'none', cursor: 'pointer',
            transform: `scale(${getScale(items.length)})`,
            transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            minWidth: '48px',
          }}
        >
          {mounted && (isDark
            ? <Sun size={20} style={{ color: 'rgba(255,255,255,0.65)' }} />
            : <Moon size={20} style={{ color: 'rgba(13,13,13,0.55)' }} />
          )}
          <span style={{
            fontSize: '10px', marginTop: '4px',
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(13,13,13,0.45)',
            whiteSpace: 'nowrap',
          }}>
            {mounted ? (isDark ? (isRTL ? 'فاتح' : 'Light') : (isRTL ? 'داكن' : 'Dark')) : ''}
          </span>
        </button>

        {/* Logout */}
        {onLogout && (
          <button
            onMouseEnter={() => setHoveredIndex(items.length + 1)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => { onLogout(); setExpanded(false) }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', padding: '8px 12px', borderRadius: '14px',
              background: hoveredIndex === items.length + 1
                ? 'rgba(239,68,68,0.1)' : 'transparent',
              border: 'none', cursor: 'pointer',
              transform: `scale(${getScale(items.length + 1)})`,
              transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
              minWidth: '48px',
            }}
          >
            <LogOut size={20} style={{ color: '#ef4444' }} />
            <span style={{
              fontSize: '10px', marginTop: '4px',
              color: '#ef4444', whiteSpace: 'nowrap',
            }}>
              {isRTL ? 'خروج' : 'Logout'}
            </span>
          </button>
        )}
      </div>

      {/* MOBILE EXPANDED OVERLAY */}
      {expanded && (
        <div
          className="md:hidden fixed inset-0 z-[9997]"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setExpanded(false)}
        />
      )}

      {/* MOBILE EXPANDED MENU */}
      {expanded && (
        <div
          className="md:hidden fixed z-[9998]"
          style={{
            ...(position === 'bottom' ? { bottom: '80px' } : { top: '80px' }),
            right: '16px',
            background: isDark ? 'rgba(15,18,33,0.95)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(24px)',
            borderRadius: '16px',
            padding: '8px',
            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            minWidth: '180px',
          }}
        >
          {items.map((item, i) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const label = isRTL ? item.labelAr : item.labelEn
            return (
              <Link
                key={i}
                href={item.href}
                onClick={() => setExpanded(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  textDecoration: 'none',
                  background: isActive
                    ? isDark ? 'rgba(81,32,200,0.25)' : 'rgba(81,32,200,0.1)'
                    : 'transparent',
                }}
              >
                <Icon size={18} style={{ color: isActive ? '#5120c8' : isDark ? 'rgba(255,255,255,0.65)' : 'rgba(13,13,13,0.55)' }} />
                <span style={{
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '400',
                  color: isActive ? '#5120c8' : isDark ? 'rgba(255,255,255,0.8)' : '#0d0d0d',
                }}>
                  {label}
                </span>
              </Link>
            )
          })}

          <div style={{ height: '1px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

          <button
            onClick={() => { setTheme(isDark ? 'light' : 'dark'); setExpanded(false) }}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 14px', borderRadius: '10px',
              background: 'transparent', border: 'none', cursor: 'pointer', width: '100%',
            }}
          >
            {mounted && (isDark
              ? <Sun size={18} style={{ color: 'rgba(255,255,255,0.65)' }} />
              : <Moon size={18} style={{ color: 'rgba(13,13,13,0.55)' }} />
            )}
            <span style={{ fontSize: '14px', color: isDark ? 'rgba(255,255,255,0.8)' : '#0d0d0d' }}>
              {mounted ? (isDark ? (isRTL ? 'الوضع الفاتح' : 'Light Mode') : (isRTL ? 'الوضع الداكن' : 'Dark Mode')) : ''}
            </span>
          </button>

          {onLogout && (
            <button
              onClick={() => { onLogout(); setExpanded(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 14px', borderRadius: '10px',
                background: 'transparent', border: 'none', cursor: 'pointer', width: '100%',
              }}
            >
              <LogOut size={18} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '14px', color: '#ef4444' }}>
                {isRTL ? 'تسجيل الخروج' : 'Sign Out'}
              </span>
            </button>
          )}
        </div>
      )}
    </>
  )
}
