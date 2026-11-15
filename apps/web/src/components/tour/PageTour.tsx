'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { HelpCircle } from 'lucide-react'

export interface TourStepDef {
  /** Value of the data-tour attribute on the target element. */
  target: string
  /** Optional CSS selector used instead of the data-tour attribute (for shared elements such as the footer). */
  selector?: string
  side: 'top' | 'bottom' | 'left' | 'right'
  ar: { title: string; description: string }
  en: { title: string; description: string }
}

export interface PageTourProps {
  tourKey: string
  steps: TourStepDef[]
  locale?: string
  isOpen?: boolean
  onClose?: () => void
  /** Start automatically on the first visit. */
  autoStart?: boolean
}

/** Shared Driver.js tour: auto-starts once per tourKey, or opens on demand via isOpen. */
export function PageTour({ tourKey, steps, locale = 'ar', isOpen, onClose, autoStart = true }: PageTourProps) {
  const isAr = locale === 'ar'
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const startTour = useCallback(() => {
    const driverSteps = steps
      .map((step) => ({
        element: step.selector ?? `[data-tour="${step.target}"]`,
        popover: {
          title: isAr ? step.ar.title : step.en.title,
          description: isAr ? step.ar.description : step.en.description,
          side: step.side,
          align: 'center' as const,
        },
      }))
      .filter((step) => {
        const el = document.querySelector(step.element)
        if (!el) return false
        const rect = el.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0
      })

    if (!driverSteps.length) return

    const driverObj = driver({
      animate: true,
      smoothScroll: true,
      allowClose: true,
      allowKeyboardControl: true,
      showButtons: ['next', 'previous', 'close'],
      overlayOpacity: 0.65,
      stagePadding: 10,
      stageRadius: 12,
      showProgress: true,
      progressText: isAr ? '{{current}} من {{total}}' : '{{current}} of {{total}}',
      nextBtnText: isAr ? 'التالي' : 'Next',
      prevBtnText: isAr ? 'السابق' : 'Back',
      doneBtnText: isAr ? 'تم' : 'Done',
      onDestroyed: () => {
        try {
          localStorage.setItem(tourKey, 'done')
        } catch {}
        onCloseRef.current?.()
      },
      steps: driverSteps,
    })

    driverObj.drive()
  }, [isAr, steps, tourKey])

  // Auto-start on the first visit only
  useEffect(() => {
    if (!autoStart) return
    try {
      if (localStorage.getItem(tourKey)) return
    } catch {
      return
    }
    const timer = setTimeout(startTour, 1400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Controlled mode (triggered by the button)
  useEffect(() => {
    if (isOpen === true) startTour()
  }, [isOpen, startTour])

  return null
}

/** Tour plus its floating HelpCircle trigger button. */
export function PageTourLauncher({
  tourKey,
  steps,
  locale: localeProp,
}: {
  tourKey: string
  steps: TourStepDef[]
  locale?: string
}) {
  const detected = useLocale()
  const locale = localeProp || detected
  const isAr = locale === 'ar'
  const [open, setOpen] = useState(false)

  return (
    <>
      <PageTour tourKey={tourKey} steps={steps} locale={locale} isOpen={open} onClose={() => setOpen(false)} />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tour-trigger-btn"
        aria-label={isAr ? 'جولة تعريفية' : 'Take a Tour'}
      >
        <HelpCircle size={15} />
        <span>{isAr ? 'جولة تعريفية' : 'Tour'}</span>
      </button>
    </>
  )
}
