'use client'

import { ShoppingCart } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { MAIN_URL } from '../../lib/constants'
import { useLocale } from 'next-intl'

export function CartIcon() {
  const locale = useLocale()
  const token = useAuthStore((s) => s.token)

  const { data: count = 0 } = useQuery({
    queryKey: ['cart-count'],
    enabled: !!token,
    queryFn: async () => {
      try {
        const res = await get('/cart')
        const d = (res?.data as any)?.data ?? (res?.data as any)
        const items = d?.items ?? d
        return Array.isArray(items) ? items.length : 0
      } catch {
        return 0
      }
    },
    refetchInterval: 30000,
  })

  return (
    <a
      href={`${MAIN_URL}/${locale}/checkout`}
      className="relative inline-flex items-center justify-center h-9 w-9 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="Cart"
    >
      <ShoppingCart className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </a>
  )
}
