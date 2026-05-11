'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { DynamicText } from '../../components/ui/DynamicText'
import { howData } from '../../../data/how'

const stepColors = [
  { gradient: 'from-[#5120c8] to-cyan-400', shadow: 'shadow-[#5120c8]/30', ring: 'ring-[#5120c8]/20', accent: 'bg-[#5120c8]' },
  { gradient: 'from-purple-500 to-pink-400', shadow: 'shadow-purple-500/30', ring: 'ring-purple-500/20', accent: 'bg-purple-500' },
  { gradient: 'from-orange-500 to-yellow-400', shadow: 'shadow-orange-500/30', ring: 'ring-orange-500/20', accent: 'bg-orange-500' },
  { gradient: 'from-green-500 to-teal-400', shadow: 'shadow-green-500/30', ring: 'ring-green-500/20', accent: 'bg-green-500' },
  { gradient: 'from-red-500 to-rose-400', shadow: 'shadow-red-500/30', ring: 'ring-red-500/20', accent: 'bg-red-500' },
  { gradient: 'from-indigo-500 to-violet-400', shadow: 'shadow-indigo-500/30', ring: 'ring-indigo-500/20', accent: 'bg-indigo-500' },
]

export function HowItWorksSection() {
  const locale = useLocale() as 'ar' | 'en'
  const data = howData
  const sectionRef = useRef<HTMLDivElement>(null)
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set())

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-step') || '0')
          if (entry.isIntersecting) {
            setTimeout(() => {
              setVisibleSteps((prev) => new Set([...Array.from(prev), index]))
            }, 100)
          }
        })
      },
      { threshold: 0.15, rootMargin: '-30px' }
    )

    const elements = sectionRef.current?.querySelectorAll('.step-card')
    elements?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative py-20 overflow-hidden">
      {/* خلفية مختلفة للبوكسات */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-100/80 via-slate-50/50 to-slate-100/80 dark:from-slate-900/80 dark:via-slate-900/50 dark:to-slate-900/80" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* العنوان */}
        <div className="text-center mb-16">
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 ${locale === 'ar' ? 'font-madinet' : ''}`}>
            <DynamicText content={data.title} />
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            <DynamicText content={data.subtitle} />
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* الخط المركزي */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2">
            <div className="h-full bg-gradient-to-b from-[#5120c8] via-purple-500 to-pink-500 rounded-full" />
          </div>

          {/* العناصر */}
          <div className="space-y-12 md:space-y-16">
            {data.steps.map((step, index) => {
              const isRight = index % 2 === 0
              const isVisible = visibleSteps.has(index)
              const colors = stepColors[index % stepColors.length]

              return (
                <div
                  key={step.id}
                  data-step={index}
                  className="step-card relative"
                >
                  <div className="md:grid md:grid-cols-2 md:gap-8 items-center">

                    {/* العمود الأول - المحتوى */}
                    <div
                      className={`
                        ${isRight ? 'md:order-1' : 'md:order-2'}
                        ${isVisible ? (isRight ? 'animate-slide-in-right' : 'animate-slide-in-left') : 'opacity-0'}
                      `}
                    >
                      {/* ✅ بوكس أوضح بظل قوي وحدود واضحة */}
                      <div className={`
                        relative p-6 rounded-2xl 
                        bg-white dark:bg-gray-800
                        border-2 border-gray-200 dark:border-gray-700
                        shadow-xl ${colors.shadow}
                        ring-2 ${colors.ring}
                        hover:shadow-2xl hover:scale-[1.02]
                        transition-all duration-500 group
                      `}>

                        {/* شريط ملون علوي */}
                        <div className={`absolute top-0 right-0 left-0 h-1 rounded-t-2xl bg-gradient-to-r ${colors.gradient}`} />

                        {/* الأيقونة والرقم */}
                        <div className="flex items-start gap-4">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors.gradient} flex items-center justify-center text-2xl shadow-lg shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                            {step.icon}
                          </div>

                          <div className="flex-1">
                            {/* رقم الخطوة */}
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${colors.gradient} text-white mb-3`}>
                              {locale === 'ar' ? `الخطوة ${index + 1}` : `Step ${index + 1}`}
                            </span>

                            {/* العنوان */}
                            <h3 className={`text-xl font-bold text-gray-900 dark:text-white mb-3 ${locale === 'ar' ? 'font-madinet' : ''}`}>
                              <DynamicText content={step.title} />
                            </h3>

                            {/* ✅ الوصف مع مسافة أكبر - خاصة للخطوة الثانية */}
                            <p className={`text-gray-600 dark:text-gray-400 text-sm leading-relaxed ${index === 1 ? 'mt-4' : 'mb-4'}`}>
                              <DynamicText content={step.desc} />
                            </p>

                            {/* الرابط */}
                            <div className="mt-4">
                              {step.external ? (
                                <a
                                  href={step.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${colors.accent} text-white text-sm font-medium hover:opacity-90 transition-opacity`}
                                >
                                  <DynamicText content={data.cta} />
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6l-3-3" />
                                  </svg>
                                </a>
                              ) : (
                                <Link
                                  href={step.href}
                                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${colors.accent} text-white text-sm font-medium hover:opacity-90 transition-opacity`}
                                >
                                  <DynamicText content={data.cta} />
                                  <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* العمود الثاني - فارغ */}
                    <div className={isRight ? 'md:order-2' : 'md:order-1'} />

                    {/* النقطة على الخط */}
                    <div className={`hidden md:flex absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-r ${colors.gradient} border-4 border-white dark:border-gray-900 shadow-xl z-10`} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}