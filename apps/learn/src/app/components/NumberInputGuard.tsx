'use client'

import { useEffect } from 'react'

/**
 * Stops the mouse wheel from changing the value of a focused number input.
 * Without this, scrolling while an <input type="number"> is focused silently
 * increments/decrements its value. It also blurs the input so the user can
 * keep scrolling the page normally.
 */
export default function NumberInputGuard() {
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const target = e.target
      if (
        target instanceof HTMLInputElement &&
        target.type === 'number' &&
        document.activeElement === target
      ) {
        e.preventDefault()
        target.blur()
      }
    }
    document.addEventListener('wheel', onWheel, { passive: false })
    return () => document.removeEventListener('wheel', onWheel)
  }, [])

  return null
}
