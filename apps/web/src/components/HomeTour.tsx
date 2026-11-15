'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { HelpCircle } from 'lucide-react'

const TOUR_KEY = 'deveway_home_tour_v1'

interface HomeTourProps {
  locale?: string
  isOpen?: boolean
  onClose?: () => void
  /** Start automatically on the first visit. */
  autoStart?: boolean
}

export function HomeTour({ locale = 'ar', isOpen, onClose, autoStart = true }: HomeTourProps) {
  const isAr = locale === 'ar'
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const startTour = useCallback(() => {
    const steps = [
      {
        element: '[data-tour="hero"]',
        popover: {
          title: isAr ? 'مرحباً في DeveWay' : 'Welcome to DeveWay',
          description: isAr
            ? 'منصتك للتوجيه المهني والتدريب — كل ما تحتاجه في مكان واحد.'
            : 'Your career guidance and training platform — everything in one place.',
          side: 'bottom' as const,
          align: 'center' as const,
        },
      },
      {
        element: '[data-tour="assessment"]',
        popover: {
          title: isAr ? 'تقييم رشيد المجاني' : 'Free Career Assessment',
          description: isAr
            ? 'خمس دقائق تكشف مسارك المهني المناسب — رشيد يحلل اهتماماتك ومهاراتك وطلب السوق.'
            : '5 minutes to discover your ideal career path based on your interests and market demand.',
          side: 'bottom' as const,
          align: 'start' as const,
        },
      },
      {
        element: '[data-tour="how-it-works"]',
        popover: {
          title: isAr ? 'كيف نعمل' : 'How It Works',
          description: isAr
            ? 'رحلة من أربع خطوات: استكشف، افهم، اتبع مسارك، واستعد لسوق العمل.'
            : 'A 4-step journey: explore, understand, follow your path, and get job-ready.',
          side: 'top' as const,
          align: 'center' as const,
        },
      },
      {
        element: '[data-tour="tracks"]',
        popover: {
          title: isAr ? 'المسارات المهنية' : 'Career Tracks',
          description: isAr
            ? 'ستة مسارات مبنية على احتياجات سوق العمل في السعودية ومصر، كل مسار يضم كورسات مرتبة بالتسلسل الصحيح.'
            : '6 tracks built for the Saudi and Egyptian job markets, each with courses in the right sequence.',
          side: 'top' as const,
          align: 'center' as const,
        },
      },
      {
        element: '[data-tour="mentors"]',
        popover: {
          title: isAr ? 'الإرشاد البشري' : 'Human Mentorship',
          description: isAr
            ? 'مرشدون حقيقيون لجلسات فردية، عيادات جماعية، ومراجعة ملفاتك في اللحظات المهمة.'
            : 'Real mentors for 1-on-1 sessions, group clinics, and expert reviews at key moments.',
          side: 'top' as const,
          align: 'center' as const,
        },
      },
      {
        element: '[data-tour="cta-final"]',
        popover: {
          title: isAr ? 'مستعد للانطلاق؟' : 'Ready to Start?',
          description: isAr
            ? 'ابدأ تقييمك المجاني الآن — خمس دقائق وتخرج بخطة واضحة.'
            : 'Start your free assessment now — 5 minutes to a clear plan.',
          side: 'top' as const,
          align: 'center' as const,
        },
      },
    ].filter((step) => document.querySelector(step.element))

    if (!steps.length) return

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
          localStorage.setItem(TOUR_KEY, 'done')
        } catch {}
        onCloseRef.current?.()
      },
      steps,
    })

    driverObj.drive()
  }, [isAr])

  // Auto-start on the first visit only
  useEffect(() => {
    if (!autoStart) return
    try {
      if (localStorage.getItem(TOUR_KEY)) return
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

/** Tour plus its floating trigger button; used from the server-rendered homepage. */
export function HomeTourLauncher() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const [tourOpen, setTourOpen] = useState(false)

  return (
    <>
      <HomeTour locale={locale} isOpen={tourOpen} onClose={() => setTourOpen(false)} />
      <button
        type="button"
        onClick={() => setTourOpen(true)}
        className="tour-trigger-btn"
        aria-label={isAr ? 'جولة تعريفية' : 'Take a Tour'}
      >
        <HelpCircle size={15} />
        <span>{isAr ? 'جولة تعريفية' : 'Tour'}</span>
      </button>
    </>
  )
}
