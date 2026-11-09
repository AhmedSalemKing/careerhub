'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

export interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>
  labelAr: string
  labelEn: string
  href: string
}

/**
 * Desktop (lg+) dashboard sidebar. Receives the same role-aware items the
 * BottomDock uses, so links and routing are identical. Hidden below lg via CSS.
 */
export function DashboardSidebar({ items, onLogout }: { items: SidebarItem[]; onLogout?: () => void }) {
  const locale = useLocale()
  const pathname = usePathname() || ''
  const user = useAuthStore((s) => s.user)
  const isAr = locale === 'ar'
  const firstName = user?.profile?.firstName || user?.email?.split('@')[0] || ''
  const initials = firstName[0]?.toUpperCase() || '?'

  return (
    <aside className="dw-dashboard-sidebar">
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== `/${locale}/dashboard` && pathname.startsWith(item.href + '/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`dw-dash-link${isActive ? ' active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon />
              <span>{isAr ? item.labelAr : item.labelEn}</span>
            </Link>
          )
        })}
      </nav>

      <div className="dw-dash-side-foot">
        {user && (
          <div className="dw-dash-side-user">
            {user.profile?.avatar ? (
              <img src={user.profile.avatar} alt="" className="avatar" />
            ) : (
              <span className="avatar fallback">{initials}</span>
            )}
            <span className="name">{user.profile?.firstName || user.email}</span>
          </div>
        )}
        {onLogout && (
          <button type="button" onClick={onLogout} className="dw-dash-link logout">
            <LogOut />
            <span>{isAr ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>
        )}
      </div>
    </aside>
  )
}
