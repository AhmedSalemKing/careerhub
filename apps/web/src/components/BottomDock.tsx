'use client'
import { useEffect, useState } from 'react'
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
      {/* MAIN DOCK - hidden on mobile, visible on desktop */}
      <div
        className="hidden lg:flex"
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


    </>
  )
}
