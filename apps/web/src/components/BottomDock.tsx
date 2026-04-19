'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Sun, Moon, LogOut } from 'lucide-react'

interface DockItem {
  icon: any
  label: string
  labelAr: string
  href: string
}

interface BottomDockProps {
  items: DockItem[]
  onLogout?: () => void
}

export default function BottomDock({ items, onLogout }: BottomDockProps) {
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    const t = setTimeout(() => setVisible(true), 150)
    return () => clearTimeout(t)
  }, [])

  const getScale = (index: number) => {
    if (hoveredIndex === null) return 1
    const distance = Math.abs(index - hoveredIndex)
    if (distance === 0) return 1.25
    if (distance === 1) return 1.1
    if (distance === 2) return 1.05
    return 1
  }

  return (
    <div className="fixed bottom-5 left-0 right-0 flex justify-center z-50 pointer-events-none">
      <div
        className={`pointer-events-auto flex items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-700 ease-out ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
        }`}
        style={{
          background: theme === 'dark'
            ? 'rgba(15, 18, 33, 0.85)'
            : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: theme === 'dark'
            ? '1px solid rgba(255,255,255,0.08)'
            : '1px solid rgba(0,0,0,0.08)',
          boxShadow: theme === 'dark'
            ? '0 8px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)'
            : '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {items.map((item, i) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const scale = getScale(i)

          return (
            <Link
              key={i}
              href={item.href}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="relative flex flex-col items-center justify-center px-3 py-2 rounded-xl cursor-pointer group"
              style={{
                transform: `scale(${scale})`,
                transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transitionDelay: visible ? `${i * 60}ms` : '0ms',
                background: isActive
                  ? theme === 'dark'
                    ? 'rgba(81, 32, 200, 0.3)'
                    : 'rgba(81, 32, 200, 0.1)'
                  : 'transparent',
              }}
            >
              <Icon
                size={20}
                style={{
                  color: isActive
                    ? '#5120c8'
                    : theme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(13,13,13,0.6)',
                  transition: 'color 0.2s ease',
                }}
              />
              <span
                style={{
                  fontSize: '10px',
                  marginTop: '3px',
                  fontWeight: isActive ? '600' : '400',
                  color: isActive
                    ? '#5120c8'
                    : theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(13,13,13,0.5)',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.labelAr}
              </span>
              {isActive && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: '#5120c8',
                  }}
                />
              )}
            </Link>
          )
        })}

        <div
          style={{
            width: '1px',
            height: '32px',
            background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            margin: '0 4px',
          }}
        />

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onMouseEnter={() => setHoveredIndex(items.length)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="flex flex-col items-center justify-center px-3 py-2 rounded-xl"
          style={{
            transform: `scale(${getScale(items.length)})`,
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {mounted && theme === 'dark'
            ? <Sun size={20} style={{ color: 'rgba(255,255,255,0.7)' }} />
            : <Moon size={20} style={{ color: 'rgba(13,13,13,0.6)' }} />
          }
          <span style={{ fontSize: '10px', marginTop: '3px', color: theme === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(13,13,13,0.4)' }}>
            {mounted && theme === 'dark' ? 'فاتح' : 'داكن'}
          </span>
        </button>

        {/* Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            onMouseEnter={() => setHoveredIndex(items.length + 1)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="flex flex-col items-center justify-center px-3 py-2 rounded-xl"
            style={{
              transform: `scale(${getScale(items.length + 1)})`,
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <LogOut size={20} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: '10px', marginTop: '3px', color: '#ef4444' }}>خروج</span>
          </button>
        )}
      </div>
    </div>
  )
}
