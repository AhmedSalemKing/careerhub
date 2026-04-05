'use client'
import { useRef, useState } from 'react'
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { useLocale } from 'next-intl'
import {
  Compass, BookOpen, Users, Trophy,
  ArrowLeft, Sparkles, ChevronDown, Star
} from 'lucide-react'

const STEPS = [
  {
    id: 1,
    icon: Compass,
    number: '01',
    titleAr: 'اكتشف مسارك',
    titleEn: 'Discover Your Path',
    descAr: 'اجتز اختبار الذكاء الاصطناعي واحصل على تقرير مهني مخصص يحدد أفضل مسار لك',
    descEn: 'Take our AI assessment and get a personalized career report',
    detailsAr: ['تحليل الشخصية المهنية', 'توصية بـ 3 مسارات مناسبة', 'خطة تعلم مخصصة', 'متوسط رواتب السوق'],
    color: '#3b82f6',
    glow: 'rgba(59,130,246,0.3)',
    bg: 'from-blue-500/20 to-blue-600/5',
    badge: 'مجاني',
  },
  {
    id: 2,
    icon: BookOpen,
    number: '02',
    titleAr: 'تعلم المهارات',
    titleEn: 'Learn Skills',
    descAr: 'كورسات مرتبطة بمسارك المهني مع محاضرين خبراء وتطبيق عملي حقيقي',
    descEn: 'Courses linked to your career path with expert instructors',
    detailsAr: ['150+ كورس احترافي', 'فيديوهات + تمارين', 'شهادات معتمدة', 'تعلم بالسرعة المناسبة'],
    color: '#8b5cf6',
    glow: 'rgba(139,92,246,0.3)',
    bg: 'from-purple-500/20 to-purple-600/5',
    badge: '150+ كورس',
  },
  {
    id: 3,
    icon: Users,
    number: '03',
    titleAr: 'احصل على كوتشينج',
    titleEn: 'Get Coached',
    descAr: 'جلسات فردية مع مستشارين مهنيين خبراء يوجهونك خطوة بخطوة',
    descEn: '1-on-1 sessions with expert career consultants',
    detailsAr: ['50+ مستشار متخصص', 'حجز مرن عبر Zoom', 'تحضير للمقابلات', 'بناء خطة مهنية'],
    color: '#06b6d4',
    glow: 'rgba(6,182,212,0.3)',
    bg: 'from-cyan-500/20 to-cyan-600/5',
    badge: '50+ خبير',
  },
  {
    id: 4,
    icon: Trophy,
    number: '04',
    titleAr: 'حقق هدفك',
    titleEn: 'Achieve Your Goal',
    descAr: 'احصل على شهادتك المعتمدة وابدأ مسيرتك المهنية بثقة وجاهزية حقيقية',
    descEn: 'Get certified and launch your career with confidence',
    detailsAr: ['شهادات معترف بها', 'CV احترافي', 'تحضير للمقابلات', 'دعم مستمر'],
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.3)',
    bg: 'from-amber-500/20 to-amber-600/5',
    badge: 'ابدأ الآن',
  },
]

export function JourneySection() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const sectionRef = useRef<HTMLDivElement>(null)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start']
  })

  const lineHeight = useTransform(scrollYProgress, [0.1, 0.9], ['0%', '100%'])

  return (
    <section
      ref={sectionRef}
      className="relative py-32 overflow-hidden"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 right-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-[120px]" />
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-primary/40"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary mb-5"
          >
            <Sparkles className="h-4 w-4" />
            {isAr ? 'رحلتك المهنية' : 'Your Career Journey'}
          </motion.div>

          <h2 className="text-4xl sm:text-5xl font-bold font-madinet text-white mb-4">
            {isAr ? 'كيف يعمل مسارك؟' : 'How Does It Work?'}
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            {isAr
              ? 'خطوات بسيطة وذكية توصلك من الصفر إلى أول وظيفة في مجالك'
              : 'Simple smart steps from zero to your first job'}
          </p>
        </motion.div>

        {/* Journey Layout */}
        <div className="relative">

          {/* Animated vertical line (desktop) */}
          <div className="absolute right-1/2 top-0 bottom-0 w-px hidden lg:block translate-x-1/2">
            <div className="absolute inset-0 bg-white/5" />
            <motion.div
              className="absolute top-0 left-0 right-0 origin-top"
              style={{
                height: lineHeight,
                background: 'linear-gradient(180deg, #3b82f6, #8b5cf6, #06b6d4, #f59e0b)',
              }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-12 lg:space-y-0">
            {STEPS.map((step, index) => {
              const isLeft = index % 2 === 0
              const Icon = step.icon
              const isActive = activeStep === step.id
              const isHovered = hoveredStep === step.id

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative lg:grid lg:grid-cols-2 lg:gap-16 items-center ${
                    index > 0 ? 'lg:mt-24' : ''
                  }`}
                >
                  {/* Content */}
                  <div className={isLeft ? 'lg:text-right' : 'lg:order-2 lg:text-left'}>
                    <motion.div
                      onHoverStart={() => setHoveredStep(step.id)}
                      onHoverEnd={() => setHoveredStep(null)}
                      onClick={() => setActiveStep(isActive ? null : step.id)}
                      whileHover={{ y: -8 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="cursor-pointer"
                    >
                      {/* Card */}
                      <div
                        className={`relative rounded-3xl border p-6 transition-all duration-500 ${
                          isHovered || isActive
                            ? 'border-white/20 bg-white/8'
                            : 'border-white/8 bg-white/4'
                        }`}
                        style={{
                          boxShadow: isHovered || isActive
                            ? `0 20px 60px ${step.glow}, 0 0 0 1px ${step.color}20`
                            : 'none',
                        }}
                      >
                        {/* Gradient bg */}
                        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.bg} opacity-50`} />

                        <div className="relative">
                          {/* Header */}
                          <div className={`flex items-start gap-4 mb-4 ${!isLeft ? '' : 'flex-row-reverse lg:flex-row'}`}>
                            {/* Icon */}
                            <motion.div
                              animate={isHovered || isActive ? { rotate: [0, -10, 10, 0], scale: 1.1 } : { rotate: 0, scale: 1 }}
                              transition={{ duration: 0.4 }}
                              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                              style={{
                                background: `linear-gradient(135deg, ${step.color}30, ${step.color}10)`,
                                border: `1px solid ${step.color}40`,
                              }}
                            >
                              <Icon className="h-7 w-7" style={{ color: step.color }} />
                            </motion.div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span
                                  className="text-xs font-bold font-mono"
                                  style={{ color: step.color }}
                                >
                                  {step.number}
                                </span>
                                <span
                                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                                  style={{ background: `${step.color}20`, color: step.color }}
                                >
                                  {step.badge}
                                </span>
                              </div>
                              <h3 className="text-xl font-bold font-madinet text-white">
                                {isAr ? step.titleAr : step.titleEn}
                              </h3>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-white/60 text-sm leading-relaxed mb-4">
                            {isAr ? step.descAr : step.descEn}
                          </p>

                          {/* Expand toggle */}
                          <button
                            className="flex items-center gap-1 text-xs font-semibold transition-colors"
                            style={{ color: step.color }}
                          >
                            {isAr ? (isActive ? 'أقل' : 'المزيد') : isActive ? 'Less' : 'More'}
                            <motion.div
                              animate={{ rotate: isActive ? 180 : 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </motion.div>
                          </button>

                          {/* Expandable details */}
                          <AnimatePresence>
                            {isActive && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.35, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="mt-4 pt-4 border-t border-white/10">
                                  <div className="grid grid-cols-2 gap-2">
                                    {step.detailsAr.map((detail, i) => (
                                      <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.07 }}
                                        className="flex items-center gap-2 text-xs text-white/70"
                                      >
                                        <div
                                          className="h-1.5 w-1.5 rounded-full shrink-0"
                                          style={{ background: step.color }}
                                        />
                                        {detail}
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Center node (desktop) */}
                  <div className="hidden lg:flex absolute right-1/2 translate-x-1/2 items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ type: 'spring', delay: index * 0.15 + 0.3 }}
                      className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 bg-[color:var(--surface)]"
                      style={{
                        borderColor: isHovered || isActive ? step.color : 'rgba(255,255,255,0.15)',
                        boxShadow: isHovered || isActive ? `0 0 20px ${step.glow}` : 'none',
                        transition: 'all 0.3s',
                      }}
                    >
                      <AnimatePresence>
                        {(isHovered || isActive) && (
                          <motion.div
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 2, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="absolute inset-0 rounded-full"
                            style={{ background: step.color }}
                          />
                        )}
                      </AnimatePresence>
                      <span
                        className="text-sm font-bold font-mono"
                        style={{ color: isHovered || isActive ? step.color : 'rgba(255,255,255,0.4)' }}
                      >
                        {step.number}
                      </span>
                    </motion.div>
                  </div>

                  {/* Empty column for alternating layout */}
                  <div className={isLeft ? 'lg:order-2' : 'lg:order-1'} />
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mt-24"
        >
          <motion.a
            href={`/${locale}/register`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="relative inline-flex items-center gap-3 overflow-hidden rounded-2xl px-10 py-4 font-bold text-white text-lg shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              boxShadow: '0 20px 60px rgba(59,130,246,0.3)',
            }}
          >
            <motion.div
              className="absolute inset-0 -skew-x-12 bg-white/10"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />
            <Sparkles className="relative h-5 w-5" />
            <span className="relative">
              {isAr ? 'ابدأ رحلتك المجانية الآن' : 'Start Your Free Journey Now'}
            </span>
            <ArrowLeft className={`relative h-5 w-5 ${isAr ? '' : 'rotate-180'}`} />
          </motion.a>

          <p className="mt-4 text-sm text-white/30">
            {isAr ? 'لا يحتاج بطاقة ائتمانية · مجاني للأبد' : 'No credit card · Free forever'}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
