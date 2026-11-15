'use client'

import { useCallback, useEffect, useRef } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'

const TOUR_KEY = 'deveway_careers_tour_v1'

interface CareersTourProps {
  locale?: string
  isOpen?: boolean
  onClose?: () => void
  /** Start automatically on the first visit. */
  autoStart?: boolean
}

export function CareersTour({ locale = 'ar', isOpen, onClose, autoStart = true }: CareersTourProps) {
  const isAr = locale === 'ar'
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const startTour = useCallback(() => {
    const steps = [
      {
        element: '[data-tour="careers-hero"]',
        popover: {
          title: isAr ? 'استكشف المسارات المهنية' : 'Explore Career Tracks',
          description: isAr
            ? 'صفحة المسارات تعرض كل المجالات المتاحة — اختر ما يناسب اهتماماتك وأهدافك.'
            : 'Browse all available career fields — choose what matches your interests and goals.',
          side: 'bottom' as const,
          align: 'center' as const,
        },
      },
      {
        element: '[data-tour="careers-search"]',
        popover: {
          title: isAr ? 'البحث السريع' : 'Quick Search',
          description: isAr
            ? 'ابحث باسم المسار أو المهارة مباشرة — مثل "Python" أو "تصميم" أو "أمن سيبراني".'
            : 'Search by track name or skill — like "Python", "Design", or "Cybersecurity".',
          side: 'bottom' as const,
          align: 'center' as const,
        },
      },
      {
        element: '[data-tour="careers-filters"]',
        popover: {
          title: isAr ? 'الفلاتر حسب التخصص' : 'Filter by Specialty',
          description: isAr
            ? 'صفّح المسارات حسب المجال: التقنية، الأمن السيبراني، التصميم، التسويق، أو الأعمال.'
            : 'Browse tracks by field: Tech, Cybersecurity, Design, Marketing, or Business.',
          side: 'bottom' as const,
          align: 'center' as const,
        },
      },
      {
        element: '[data-tour="careers-card"]',
        popover: {
          title: isAr ? 'بطاقة المسار' : 'Track Card',
          description: isAr
            ? 'كل بطاقة تعرض المسمى الوظيفي، متطلبات السوق، والراتب المتوقع. اضغط "تفاصيل" لمعرفة المزيد.'
            : 'Each card shows the job title, market demand, and expected salary. Tap "Details" to learn more.',
          side: 'top' as const,
          align: 'center' as const,
        },
      },
      {
        element: '[data-tour="careers-ai-cta"]',
        popover: {
          title: isAr ? 'مش عارف تختار؟' : 'Not Sure Which Path?',
          description: isAr
            ? 'اضغط "اكتشف مسارك بالذكاء الاصطناعي" — رشيد يحلل مهاراتك في 5 دقائق ويرشح ليك المسار الأنسب.'
            : 'Tap "Discover your path with AI" — Rashid analyzes your skills in 5 minutes and recommends the best fit.',
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
