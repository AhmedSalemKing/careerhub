'use client'

import * as Toast from '@radix-ui/react-toast'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastVariant = 'default' | 'success' | 'danger'

type ToastItem = {
  id: string
  title?: string
  description: string
  variant: ToastVariant
}

type ToastCtx = {
  toast: (t: { title?: string; description: string; variant?: ToastVariant }) => void
}

const ToastContext = createContext<ToastCtx | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback(
    (t: { title?: string; description: string; variant?: ToastVariant }) => {
      setItems((prev) => [
        ...prev,
        {
          id: String(Date.now()) + '-' + Math.random().toString(16).slice(2),
          title: t.title,
          description: t.description,
          variant: t.variant ?? 'default',
        },
      ])
    },
    []
  )

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      <Toast.Provider swipeDirection="right">
        {children}
        <Toast.Viewport className="fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm space-y-2 outline-none" />
        {items.map((item) => (
          <Toast.Root
            key={item.id}
            duration={4500}
            onOpenChange={(open) => {
              if (!open) setItems((prev) => prev.filter((x) => x.id !== item.id))
            }}
            className={[
              'rounded-xl border bg-white dark:bg-gray-800 px-4 py-3 shadow-lg',
              item.variant === 'success' && 'border-green-200 dark:border-green-800',
              item.variant === 'danger' && 'border-red-200 dark:border-red-800',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {item.title ? (
              <Toast.Title className="text-sm font-semibold">{item.title}</Toast.Title>
            ) : null}
            <Toast.Description className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {item.description}
            </Toast.Description>
          </Toast.Root>
        ))}
      </Toast.Provider>
    </ToastContext.Provider>
  )
}