'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShoppingCart, X, Trash2, ArrowRight, BookOpen } from 'lucide-react'
import { get, del } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { notify } from '../../lib/notify'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

type CartItem = {
  id: string
  courseId: string
  course: {
    id: string
    titleEn: string
    titleAr?: string
    price: number
    thumbnail?: string
    level: string
  }
}

export function CartIcon() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const token = useAuthStore((s) => s.token)

  const { data: items = [] } = useQuery<CartItem[]>({
    queryKey: ['cart'],
    enabled: !!token,
    queryFn: async () => {
      try {
        const res = await get('/cart')
        const d = (res?.data as any)?.data ?? []
        return Array.isArray(d) ? d : []
      } catch {
        return []
      }
    },
  })

  const removeItem = useMutation({
    mutationFn: (courseId: string) => del(`/cart/remove/${courseId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] })
      notify.info('تمت إزالة الكورس من السلة')
    },
  })

  const total = items.reduce((sum, item) => sum + (item.course?.price || 0), 0)

  if (!token) return null

  const thumbSrc = (thumbnail?: string) =>
    thumbnail
      ? thumbnail.startsWith('http')
        ? thumbnail
        : `${API_URL}${thumbnail}`
      : null

  return (
    <>
      {/* Cart Button */}
      <button
        onClick={() => setOpen(true)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl hover:bg-[color:var(--surface-2)] transition"
        aria-label="سلة الشراء"
      >
        <ShoppingCart className="h-5 w-5 text-[color:var(--muted)]" />
        {items.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            {items.length}
          </span>
        )}
      </button>

      {/* Drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed left-0 top-0 z-50 h-full w-80 bg-[color:var(--surface)] border-r border-[color:var(--border)] shadow-2xl flex flex-col"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[color:var(--border)] p-5">
              <h2 className="text-xl font-bold font-madinet text-foreground">
                سلة الشراء ({items.length})
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl p-2 hover:bg-[color:var(--surface-2)] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-[color:var(--muted)]">
                  <ShoppingCart className="h-16 w-16 mb-4 opacity-20" />
                  <p className="text-lg font-semibold">السلة فارغة</p>
                  <p className="text-sm mt-1">أضف كورسات لبدء التعلم</p>
                </div>
              ) : (
                items.map((item) => {
                  const src = thumbSrc(item.course?.thumbnail)
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] p-3"
                    >
                      <div className="h-14 w-20 shrink-0 rounded-lg bg-[color:var(--surface-2)] overflow-hidden">
                        {src ? (
                          <img
                            src={src}
                            alt={item.course?.titleAr || item.course?.titleEn}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <BookOpen className="h-6 w-6 opacity-30 text-[color:var(--muted)]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {item.course?.titleAr || item.course?.titleEn || 'كورس'}
                        </p>
                        <p className="text-primary font-bold text-sm">
                          {item.course?.price > 0
                            ? `${item.course.price} ريال`
                            : 'مجاني'}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem.mutate(item.courseId)}
                        className="shrink-0 rounded-lg p-1.5 text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )
                })
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-[color:var(--border)] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[color:var(--muted)]">الإجمالي:</span>
                  <span className="text-xl font-bold text-primary">{total} ريال</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full rounded-2xl bg-primary py-3 font-bold text-white hover:bg-primary/90 transition flex items-center justify-center gap-2"
                >
                  إتمام الشراء
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  )
}
