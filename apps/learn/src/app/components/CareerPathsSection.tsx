'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { motion, useInView, useScroll } from 'framer-motion'
import { useLocale } from 'next-intl'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'

const STEPS = [
  { id: 1, titleAr: 'تعلم الأساسيات', titleEn: 'Learn Fundamentals', descAr: 'HTML · CSS · Logic', descEn: 'HTML · CSS · Logic' },
  { id: 2, titleAr: 'تطبيق عملي', titleEn: 'Hands-on', descAr: 'Projects حقيقية', descEn: 'Real Projects' },
  { id: 3, titleAr: 'بناء مشاريع', titleEn: 'Build Portfolio', descAr: 'Portfolio قوي', descEn: 'Strong Portfolio' },
  { id: 4, titleAr: 'توجيه احترافي', titleEn: 'Expert Guidance', descAr: 'Mentorship', descEn: 'Mentorship' },
  { id: 5, titleAr: 'احصل على وظيفة', titleEn: 'Land a Job', descAr: 'جاهز للسوق', descEn: 'Market Ready' },
]

const TOP_Y_PCT = 20
const BOTTOM_Y_PCT = 62
const VB = { w: 1000, h: 400 }

export function CareerPathsSection() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const sectionRef = useRef<HTMLDivElement>(null)
  const [activeDot, setActiveDot] = useState(0)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  useEffect(() => {
    const unsub = scrollYProgress.on('change', (v) => {
      const dot = Math.min(Math.floor(v * STEPS.length), STEPS.length - 1)
      setActiveDot(dot)
    })
    return () => unsub()
  }, [scrollYProgress])

  const isInView = useInView(sectionRef, { once: false, margin: '-25% 0px -25% 0px' })

  const { pathD, glowD, dotCoords } = useMemo(() => {
    const base = [2, 22, 44, 66, 88]
    const xs = isAr ? [...base].reverse() : base

    const coords = xs.map((x, i) => ({
      px: x,
      py: i % 2 === 0 ? TOP_Y_PCT : BOTTOM_Y_PCT,
      vx: Math.round((x / 100) * VB.w),
      vy: Math.round(((i % 2 === 0 ? TOP_Y_PCT : BOTTOM_Y_PCT) / 100) * VB.h),
    }))

    const d = coords.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.vx} ${pt.vy}`
      const prev = coords[i - 1]
      const dx = pt.vx - prev.vx
      return `${acc} C ${prev.vx + dx / 3} ${prev.vy}, ${pt.vx - dx / 3} ${pt.vy}, ${pt.vx} ${pt.vy}`
    }, '')

    return { pathD: d, glowD: d, dotCoords: coords }
  }, [isAr])

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden select-none"
      dir={isAr ? 'rtl' : 'ltr'}
      style={{ background: 'var(--background)' }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">

        {/* ══════════════════ Header ══════════════════ */}
        <div className="pt-16 sm:pt-24 pb-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest mb-5"
            style={{
              background: 'var(--primary-subtle)',
              color: 'var(--primary)',
              border: '1px solid var(--primary-border)',
            }}
          >
            <Sparkles className="h-3 w-3" />
            {isAr ? 'مسار النجاح' : 'Success Path'}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-[44px] font-bold leading-tight tracking-tight mb-3"
            style={{ color: 'var(--foreground)' }}
          >
            {isAr ? (
              <>
                الطريق الوحيد
                <span
                  style={{
                    fontFamily: "'PingARLT', sans-serif",
                    color: '#5B21B6',
                  }}
                >
                  {' '}للاحتراف
                </span>
              </>
            ) : (
              <>
                The Only Way to
                <span
                  style={{
                    fontFamily: "'28DaysLater', sans-serif",
                    color: '#5B21B6',
                  }}
                >
                  {' '}Master Tech
                </span>
              </>
            )}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-2 text-sm sm:text-base max-w-md mx-auto"
            style={{ color: 'var(--muted)' }}
          >
            {isAr
              ? 'كل خطوة محسوبة — من الصفر إلى وظيفة'
              : 'Every step calculated — from zero to a job'}
          </motion.p>
        </div>

        {/* ══════════════════ Desktop Zigzag Path (lg+) ══════════════════ */}
        <div
          className="relative hidden lg:block"
          style={{ height: `${VB.h}px` }}
        >
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${VB.w} ${VB.h}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="jgGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.02" />
                <stop offset="25%" stopColor="var(--primary)" stopOpacity="0.08" />
                <stop offset="75%" stopColor="var(--primary)" stopOpacity="0.08" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="jgLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.06" />
                <stop offset="20%" stopColor="var(--primary)" stopOpacity="0.28" />
                <stop offset="80%" stopColor="var(--primary)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.06" />
              </linearGradient>
            </defs>

            <path
              d={glowD}
              fill="none"
              stroke="url(#jgGlow)"
              strokeWidth="14"
              strokeLinecap="round"
            />

            <path
              d={pathD}
              fill="none"
              stroke="url(#jgLine)"
              strokeWidth="2"
              strokeDasharray="10 8"
              strokeLinecap="round"
              style={{
                animation: isInView ? 'dashMove 5s linear infinite' : 'none',
              }}
            />
          </svg>

          {STEPS.map((step, index) => {
            const isActive = activeDot >= index
            const { px, py } = dotCoords[index]
            const halfDot = 18

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  delay: index * 0.13,
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="absolute flex flex-col items-center"
                style={{
                  left: `${px}%`,
                  top: `calc(${py}% - ${halfDot}px)`,
                  transform: 'translateX(-50%)',
                }}
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.15 : 0.85,
                    boxShadow: isActive
                      ? '0 0 0 7px var(--primary-subtle), 0 0 24px var(--dot-glow)'
                      : '0 0 0 0px transparent',
                  }}
                  transition={{ duration: 0.4 }}
                  className="h-9 w-9 rounded-full flex-shrink-0 relative z-10"
                  style={{
                    background: isActive
                      ? 'var(--primary)'
                      : 'var(--surface-3)',
                  }}
                />

                <div
                  className="w-px flex-shrink-0"
                  style={{
                    height: '16px',
                    background: isActive
                      ? 'var(--primary-border)'
                      : 'var(--border)',
                    opacity: 0.6,
                  }}
                />

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    delay: index * 0.13 + 0.2,
                    duration: 0.4,
                    ease: 'easeOut',
                  }}
                  className="rounded-2xl px-6 py-4 transition-all duration-250 cursor-default text-center"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    minWidth: '160px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = 'var(--primary-border)'
                    el.style.background = 'var(--primary-subtle)'
                    el.style.transform = 'translateY(-4px)'
                    el.style.boxShadow = 'var(--shadow-lg)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement
                    el.style.borderColor = 'var(--border)'
                    el.style.background = 'var(--surface)'
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = 'var(--shadow-sm)'
                  }}
                >
                  <p
                    className="text-[15px] font-bold leading-tight whitespace-nowrap mb-1.5"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {isAr ? step.titleAr : step.titleEn}
                  </p>
                  <p
                    className="text-[12px] whitespace-nowrap"
                    style={{ color: 'var(--muted)' }}
                  >
                    {isAr ? step.descAr : step.descEn}
                  </p>
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        {/* ══════════════════ Tablet horizontal (md → lg) ══════════════════ */}
        <div className="relative hidden md:block lg:hidden py-8">
          <div className="flex items-center justify-between gap-3">
            {STEPS.map((step, index) => {
              const isActive = activeDot >= index
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    delay: index * 0.1,
                    duration: 0.4,
                    ease: 'easeOut',
                  }}
                  className="flex flex-col items-center flex-1"
                >
                  <motion.div
                    animate={{
                      scale: isActive ? 1.12 : 0.85,
                      boxShadow: isActive
                        ? '0 0 0 6px var(--primary-subtle), 0 0 18px var(--dot-glow)'
                        : '0 0 0 0px transparent',
                    }}
                    transition={{ duration: 0.4 }}
                    className="h-8 w-8 rounded-full flex-shrink-0 mb-3"
                    style={{
                      background: isActive
                        ? 'var(--primary)'
                        : 'var(--surface-3)',
                    }}
                  />
                  <div
                    className="rounded-2xl px-4 py-3 text-center transition-all duration-200 cursor-default"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.borderColor = 'var(--primary-border)'
                      el.style.background = 'var(--primary-subtle)'
                      el.style.transform = 'translateY(-3px)'
                      el.style.boxShadow = 'var(--shadow-lg)'
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLDivElement
                      el.style.borderColor = 'var(--border)'
                      el.style.background = 'var(--surface)'
                      el.style.transform = 'translateY(0)'
                      el.style.boxShadow = 'var(--shadow-sm)'
                    }}
                  >
                    <p
                      className="text-[13px] font-bold leading-tight whitespace-nowrap mb-1"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {isAr ? step.titleAr : step.titleEn}
                    </p>
                    <p
                      className="text-[11px] whitespace-nowrap"
                      style={{ color: 'var(--muted)' }}
                    >
                      {isAr ? step.descAr : step.descEn}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          <svg
            className="absolute top-[15px] left-0 right-0 w-full pointer-events-none"
            height="2"
            preserveAspectRatio="none"
          >
            <line
              x1="6%"
              y1="1"
              x2="94%"
              y2="1"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeDasharray="8 8"
              strokeLinecap="round"
              style={{
                opacity: 0.18,
                animation: isInView ? 'dashMove 4s linear infinite' : 'none',
              }}
            />
          </svg>
        </div>

        {/* ══════════════════ Mobile vertical timeline (<md) ══════════════════ */}
        <div className="relative py-8 md:hidden">
          <div
            className="absolute top-0 bottom-0 w-px"
            style={{
              background: 'var(--border)',
              insetInlineStart: '1rem',
            }}
          />

          <div className="flex flex-col gap-5">
            {STEPS.map((step, index) => {
              const isActive = activeDot >= index
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: isAr ? 18 : -18 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{
                    delay: index * 0.08,
                    duration: 0.35,
                    ease: 'easeOut',
                  }}
                  className="flex items-start gap-4 relative"
                >
                  <motion.div
                    animate={{
                      scale: isActive ? 1.12 : 0.85,
                      boxShadow: isActive
                        ? '0 0 0 5px var(--primary-subtle), 0 0 16px var(--dot-glow)'
                        : '0 0 0 0px transparent',
                    }}
                    transition={{ duration: 0.4 }}
                    className="h-8 w-8 rounded-full flex-shrink-0 relative z-10"
                    style={{
                      background: isActive
                        ? 'var(--primary)'
                        : 'var(--surface-3)',
                    }}
                  />

                  <div
                    className="rounded-2xl px-5 py-4 flex-1"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <p
                      className="text-[14px] font-bold leading-tight mb-1.5"
                      style={{ color: 'var(--foreground)' }}
                    >
                      {isAr ? step.titleAr : step.titleEn}
                    </p>
                    <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
                      {isAr ? step.descAr : step.descEn}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ══════════════════ CTA ══════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-center pb-16 sm:pb-20 pt-4"
        >
          <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'الاحتراف له طريق واحد واضح'
              : 'Mastery has one clear path'}
          </p>

          <motion.a
            href={`/${locale}/register`}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2.5 rounded-2xl px-10 py-4 text-[15px] font-bold text-white transition-all duration-200"
            style={{
              background: 'var(--primary)',
              boxShadow: 'var(--cta-shadow)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = 'var(--primary-hover)'
              el.style.boxShadow = 'var(--cta-shadow-hover)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement
              el.style.background = 'var(--primary)'
              el.style.boxShadow = 'var(--cta-shadow)'
            }}
          >
            {isAr ? 'ابدأ رحلتك مع DeveWay' : 'Start Your Journey'}
            {isAr ? (
              <ArrowLeft className="h-5 w-5" />
            ) : (
              <ArrowRight className="h-5 w-5" />
            )}
          </motion.a>

          <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
            {isAr
              ? 'لا حاجة لبطاقة ائتمان · إلغاء في أي وقت'
              : 'No credit card · Cancel anytime'}
          </p>
        </motion.div>
      </div>

      <style>{`
        @keyframes dashMove {
          to { stroke-dashoffset: -216; }
        }
      `}</style>
    </section>
  )
}