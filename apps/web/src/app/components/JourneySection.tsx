'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useLocale } from 'next-intl'
import {
  Compass, BookOpen, Users, Trophy,
  ArrowLeft, ArrowRight, ChevronRight, Sparkles,
} from 'lucide-react'

/* ─── Data ─── */
const STEPS = [
  {
    id: 1,
    icon: Compass,
    number: '01',
    color: '#5120c8',
    titleAr: 'اكتشف مسارك',
    titleEn: 'Discover Your Path',
    descAr: 'اختبار ذكي يحدد أفضل طريق لك خلال دقائق',
    descEn: 'A smart test that finds your best path in minutes',
    detailsAr: ['تحليل الشخصية المهنية', 'توصية بـ 3 مسارات', 'خطة تعلم مخصصة', 'تقرير رواتب السوق'],
  },
  {
    id: 2,
    icon: BookOpen,
    number: '02',
    color: '#2BBFA3',
    titleAr: 'تعلّم بوضوح',
    titleEn: 'Learn Clearly',
    descAr: 'خطة تعلم منظمة + تطبيق عملي حقيقي',
    descEn: 'Structured learning plan + hands-on practice',
    detailsAr: ['150+ كورس احترافي', 'فيديوهات عالية الجودة', 'تمارين تطبيقية', 'تقدم مرئي واضح'],
  },
  {
    id: 3,
    icon: Users,
    number: '03',
    color: '#F5A623',
    titleAr: 'دعم حقيقي',
    titleEn: 'Real Support',
    descAr: 'جلسات مع خبراء لمساعدتك في كل خطوة',
    descEn: 'Sessions with experts to help you at every step',
    detailsAr: ['50+ مستشار متخصص', 'حجز مرن عبر Zoom', 'تحضير للمقابلات', 'مراجعة الـ CV'],
  },
  {
    id: 4,
    icon: Trophy,
    number: '04',
    color: '#4318a8',
    titleAr: 'جاهز للتوظيف',
    titleEn: 'Job Ready',
    descAr: 'CV احترافي + تجهيز كامل للمقابلات',
    descEn: 'Professional CV + full interview preparation',
    detailsAr: ['شهادات معترف بها', 'CV احترافي جاهز', 'محاكاة مقابلات', 'دعم ما بعد التخرج'],
  },
]

/* ─── Colors ─── */
const C = {
  primary: '#5120c8',
  primaryHover: '#4318a8',
  deveWay: '#4318a8',
  bg: '#0D0D0D',
  cardBg: 'rgba(255,255,255,0.04)',
  cardBgHover: 'rgba(255,255,255,0.07)',
  cardBgActive: 'rgba(81,32,200,0.06)',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.14)',
  borderActive: 'rgba(81,32,200,0.35)',
  textSecondary: 'rgba(248,248,250,0.6)',
  textMuted: 'rgba(255,255,255,0.25)',
}

/* ─── Card Component ─── */
function StepCard({
  step,
  index,
  isActive,
  isPassed,
  isAr,
  onToggle,
}: {
  step: typeof STEPS[0]
  index: number
  isActive: boolean
  isPassed: boolean
  isAr: boolean
  onToggle: () => void
}) {
  const Icon = step.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      className="shrink-0 snap-center"
      style={{ width: 'clamp(260px, 72vw, 290px)' }}
    >
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        onClick={onToggle}
        className="cursor-pointer h-full"
      >
        <div
          className="relative rounded-2xl p-5 sm:p-6 transition-all duration-300 h-full flex flex-col"
          style={{
            background: isActive ? C.cardBgActive : isPassed ? C.cardBgHover : C.cardBg,
            border: `1px solid ${isActive ? C.borderActive : isPassed ? step.color + '40' : C.border}`,
            boxShadow: isActive ? '0 12px 40px -12px rgba(81,32,200,0.15)' : 'none',
          }}
        >
          {/* Number */}
          <span
            className="text-[11px] font-mono font-bold tracking-widest transition-colors duration-300"
            style={{ color: step.color }}
          >
            {step.number}
          </span>

          {/* Icon */}
          <div
            className="mt-3 mb-3 flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300"
            style={{
              background: isActive ? 'rgba(81,32,200,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isActive ? 'rgba(81,32,200,0.25)' : 'rgba(255,255,255,0.05)'}`,
            }}
          >
            <Icon
              className="h-4 w-4 transition-colors duration-300"
              style={{ color: isActive ? C.primary : C.textMuted }}
            />
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-bold leading-snug mb-1.5" style={{ color: '#F8F8FA' }}>
            {isAr ? step.titleAr : step.titleEn}
          </h3>

          {/* Desc */}
          <p className="text-[13px] leading-relaxed flex-1" style={{ color: C.textSecondary }}>
            {isAr ? step.descAr : step.descEn}
          </p>

          {/* Toggle */}
          <div className="mt-4 flex items-center gap-1.5">
            <span
              className="text-[11px] font-semibold transition-colors duration-200"
              style={{ color: isActive ? C.primary : C.textMuted }}
            >
              {isAr ? (isActive ? 'عرض أقل' : 'عرض التفاصيل') : (isActive ? 'Show less' : 'Show details')}
            </span>
            <motion.div animate={{ rotate: isActive ? 90 : 0 }} transition={{ duration: 0.2 }}>
              <ChevronRight className="h-3 w-3" style={{ color: isActive ? C.primary : C.textMuted }} />
            </motion.div>
          </div>

          {/* Details */}
          <AnimatePresence initial={false}>
            {isActive && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-3 pt-3 space-y-2" style={{ borderTop: `1px solid ${C.border}` }}>
                  {step.detailsAr.map((detail, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-2 text-[12px]"
                      style={{ color: C.textSecondary }}
                    >
                      <div className="h-1 w-1 rounded-full shrink-0" style={{ background: isActive ? C.primary : 'rgba(255,255,255,0.2)' }} />
                      {detail}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Main ─── */
export function JourneySection() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const sectionRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeStep, setActiveStep] = useState<number | null>(1)
  const [progressStep, setProgressStep] = useState(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  /* Scroll-based progress */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 0.6', 'end 0.4'],
  })

  useEffect(() => {
    const unsub = scrollYProgress.on('change', (v) => {
      const step = Math.min(Math.floor(v * STEPS.length), STEPS.length - 1)
      setProgressStep(step)
      if (activeStep === null) setActiveStep(STEPS[step].id)
    })
    return () => unsub()
  }, [scrollYProgress, activeStep])

  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  /* Horizontal scroll detection */
  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 5)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    checkScroll()
    el.addEventListener('scroll', checkScroll, { passive: true })
    window.addEventListener('resize', checkScroll)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [checkScroll])

  const scrollBy = (dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
const cardWidth = (el.querySelector('[data-card]') as HTMLElement)?.offsetWidth || 280    
const gap = 24
    el.scrollBy({ left: dir === 'left' ? -(cardWidth + gap) : (cardWidth + gap), behavior: 'smooth' })
  }

  /* Drag to scroll */
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftPos, setScrollLeftPos] = useState(0)

  const onMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current
    if (!el) return
    setIsDragging(true)
    setStartX(e.pageX - el.offsetLeft)
    setScrollLeftPos(el.scrollLeft)
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const el = scrollRef.current
    if (!el) return
    const x = e.pageX - el.offsetLeft
    const walk = (x - startX) * 1.5
    el.scrollLeft = scrollLeftPos - walk
  }

  const onMouseUp = () => setIsDragging(false)
  const onMouseLeave = () => setIsDragging(false)

  const handleToggle = (id: number) => {
    if (isDragging) return
    setActiveStep((prev) => (prev === id ? null : id))
  }

  const progressPercent = useTransform(scrollYProgress, [0, 1], [0, 100])

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden select-none"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ background: C.bg }}
    >
      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.015]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ═══ HEADER ═══ */}
        <div className="pt-24 sm:pt-28 pb-2 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-medium tracking-wide"
            style={{ background: 'rgba(81,32,200,0.08)', color: C.primary, border: '1px solid rgba(81,32,200,0.15)' }}
          >
            <Sparkles className="h-3 w-3" />
            {isAr ? 'رحلتك المهنية في 4 خطوات' : 'Your Career Journey in 4 Steps'}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-2xl sm:text-3xl lg:text-[42px] font-bold text-white leading-tight tracking-tight"
          >
            {isAr ? (
              <>كيف يعمل <span style={{ fontFamily: "'28DaysLater', sans-serif", color: C.deveWay }}>DeveWay</span>؟</>
            ) : (
              <>How Does <span style={{ fontFamily: "'28DaysLater', sans-serif", color: C.deveWay }}>DeveWay</span> Work?</>
            )}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-3 text-sm sm:text-base max-w-md mx-auto leading-relaxed"
            style={{ color: C.textSecondary }}
          >
            {isAr ? 'من اكتشاف مسارك إلى أول وظيفة — كل شيء مُنسّق تلقائياً' : 'From discovering your path to landing your first job — everything auto-organized'}
          </motion.p>
        </div>

        {/* ═══ PROGRESS DOTS ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 sm:gap-3 mt-8 sm:mt-10 mb-8 sm:mb-10"
        >
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-2 sm:gap-3">
              <motion.div
                animate={{
                  scale: progressStep >= i ? 1 : 0.75,
                  backgroundColor: progressStep >= i ? C.primary : 'rgba(255,255,255,0.10)',
                }}
                transition={{ duration: 0.4 }}
                className="rounded-full"
                style={{
                  width: '8px',
                  height: '8px',
                  boxShadow: progressStep >= i ? `0 0 10px ${C.primary}50` : 'none',
                }}
              />
              {i < STEPS.length - 1 && (
                <motion.div
                  className="rounded-full overflow-hidden"
                  style={{ width: '32px', height: '2px', background: 'rgba(255,255,255,0.06)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: C.primary }}
                    initial={{ width: '0%' }}
                    whileInView={{ width: progressStep > i ? '100%' : '0%' }}
                    viewport={{ once: false }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                  />
                </motion.div>
              )}
            </div>
          ))}
        </motion.div>

        {/* ═══ HORIZONTAL SCROLL AREA ═══ */}
        <div className="relative group">

          {/* Edge fades */}
          <div
            className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 hidden sm:block transition-opacity duration-300"
            style={{
              background: 'linear-gradient(to right, #0D0D0D, transparent)',
              opacity: canScrollLeft ? 1 : 0,
            }}
          />
          <div
            className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 hidden sm:block transition-opacity duration-300"
            style={{
              background: 'linear-gradient(to left, #0D0D0D, transparent)',
              opacity: canScrollRight ? 1 : 0,
            }}
          />

          {/* Nav arrows — desktop only */}
          {canScrollLeft && (
            <button
              onClick={() => scrollBy('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 hidden sm:flex h-9 w-9 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              {isAr ? <ArrowRight className="h-4 w-4 text-white/60" /> : <ArrowLeft className="h-4 w-4 text-white/60" />}
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scrollBy('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 hidden sm:flex h-9 w-9 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              {isAr ? <ArrowLeft className="h-4 w-4 text-white/60" /> : <ArrowRight className="h-4 w-4 text-white/60" />}
            </button>
          )}

          {/* Scroll container */}
          <div
            ref={scrollRef}
            className="flex gap-5 sm:gap-6 overflow-x-auto pb-2 pt-1 px-1"
            style={{
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
          >
            {/* Left spacer for centering on desktop */}
            <div className="shrink-0 hidden lg:block" style={{ width: 'calc((100vw - 1280px + 64px) / 2)' }} />

            {STEPS.map((step, index) => (
              <div key={step.id} data-card className="shrink-0">
                <StepCard
                  step={step}
                  index={index}
                  isActive={activeStep === step.id}
                  isPassed={progressStep > index}
                  isAr={isAr}
                  onToggle={() => handleToggle(step.id)}
                />
              </div>
            ))}

            {/* Right spacer for centering on desktop */}
            <div className="shrink-0 hidden lg:block" style={{ width: 'calc((100vw - 1280px + 64px) / 2)' }} />
          </div>

          {/* Scroll progress bar (mobile visual indicator) */}
          <div className="sm:hidden mt-4 mx-auto max-w-[200px]">
            <div className="h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: C.primary }}
                animate={{ width: `${((progressStep + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>

        {/* ═══ CTA ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center pb-24 sm:pb-28 pt-16 sm:pt-20"
        >
          <div className="mx-auto mb-10 h-px max-w-[200px]" style={{ background: C.border }} />

          <p className="text-sm mb-5" style={{ color: C.textMuted }}>
            {isAr ? 'جاهز تبدأ رحلتك المهنية؟' : 'Ready to start your career journey?'}
          </p>

          <motion.a
           ></motion.a>
        </motion.div>
      </div>
    </section>
  )
}