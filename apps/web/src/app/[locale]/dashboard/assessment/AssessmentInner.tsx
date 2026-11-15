'use client'
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import dynamic from 'next/dynamic'
import { useLocale } from 'next-intl'
import { SECTION_SVGS, SECTION_LABELS, SECTION_LABELS_EN } from './sections'
import { RasheedAvatar } from '../../../components/CharacterDuo'
import { AssessmentTourLauncher } from '@/components/AssessmentTour'

const AIInterviewPage = dynamic(() => import('./AIInterviewPage'), { ssr: false })

const clockIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
)

function AssessmentContent() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const quizRef = useRef<HTMLDivElement>(null)
  const [visibleLines, setVisibleLines] = useState(0)
  const [ctaVisible, setCtaVisible] = useState(false)
  const [sectionsVisible, setSectionsVisible] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setVisibleLines(3)
      setCtaVisible(true)
      setSectionsVisible(true)
      return
    }
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setVisibleLines(1), 350))
    timers.push(setTimeout(() => setVisibleLines(2), 1100))
    timers.push(setTimeout(() => setVisibleLines(3), 1850))
    timers.push(setTimeout(() => setCtaVisible(true), 2300))
    timers.push(setTimeout(() => setSectionsVisible(true), 2700))
    return () => timers.forEach(clearTimeout)
  }, [])

  // Single page: intro and quiz both live at /dashboard/assessment. The CTA only scrolls.
  // Interview mode stays hidden (code preserved in AIInterviewPage).
  const handleStart = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="dw-assess assess-page">
      <AssessmentTourLauncher locale="ar" />
      <section className="ri-hero">
        <div className="hero-bg" aria-hidden="true">
          <span className="dots" />
          <span className="b1" />
          <span className="b2" />
        </div>
        <div className="wrap ri-center" data-tour="assess-hero">
          <span className="eyebrow">{SECTION_SVGS[4]} {isAr ? 'مرشدك المهني بالذكاء الاصطناعي' : 'Your AI career guide'}</span>

          <div className="r-figure ri-figure" aria-hidden="true">
            <span className="r-blob" />
            <RasheedAvatar size={140} />
          </div>

          <div className="ri-lines" aria-live="polite">
            <p className={`ri-line big${visibleLines >= 1 ? ' on' : ''}`}>{isAr ? 'أهلًا، أنا رشيد، ومرحبًا بك في منصة DeveWay' : 'Hello, I\'m Rashid, and welcome to DeveWay'}</p>
            <p className={`ri-line${visibleLines >= 2 ? ' on' : ''}`}>
              {isAr ? 'أنا مرشدك المهني بالذكاء الاصطناعي. أطابق مهاراتك ودراستك وخبرتك واهتماماتك مع المسارات المهنية المطلوبة، وأشرح لك أسباب كل اقتراح.' : 'I\'m your AI career guide. I match your skills, studies, experience and interests with in-demand career paths, and explain the reasons behind every suggestion.'}
            </p>
            <p className={`ri-line${visibleLines >= 3 ? ' on' : ''}`}>
              {isAr ? 'يستغرق التقييم نحو 15–20 دقيقة في ستة أقسام قصيرة، وسأكون معك في كل خطوة. هل أنت مستعد لنكتشف طريقك معًا؟' : 'The assessment takes about 15–20 minutes in six short sections, and I\'ll be with you every step. Ready to discover your path together?'}
            </p>
          </div>

          <div className={`ri-cta${ctaVisible ? ' on' : ''}`}>
            <a className="btn btn-primary btn-lg" href="#assess-q" onClick={handleStart}>
              {isAr ? 'ابدأ التقييم مع رشيد' : 'Start the assessment with Rashid'}
              <svg className="icon go" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </a>
            <span className="muted small ri-meta">{clockIcon} {isAr ? 'نحو 15–20 دقيقة · مجاني · بالعربية' : 'About 15–20 minutes · Free'}</span>
          </div>

          <div className={`ri-secs${sectionsVisible ? ' on' : ''}`} data-tour="assess-sections">
            <ol>
              {(isAr ? SECTION_LABELS : SECTION_LABELS_EN).map((label, i) => (
                <li key={label} style={{ '--d': `${i * 70}ms` } as CSSProperties}>
                  <span className="sb-ic">{SECTION_SVGS[i]}</span>
                  <span><b>{i + 1}</b> {label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <div ref={quizRef} id="assess-q" className="assess-q">
        <div className="wrap" style={{ maxWidth: '1240px' }}>
          <div className="a-top a-top-sm">
            <span className="eyebrow">{clockIcon} {isAr ? 'نحو 15–20 دقيقة' : 'About 15–20 minutes'}</span>
            <h2 className="h2">{isAr ? 'التقييم المهني المجاني مع رشيد' : 'The free career assessment with Rashid'}</h2>
          </div>
        </div>
        <AIInterviewPage mode="quiz" embedded />
      </div>

      <div className="dw-as-note">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        {isAr ? 'التوصيات مبنية على المعلومات التي تشاركها معنا، وهي إرشاد مهني وليست ضماناً لوظيفة معينة.' : 'Recommendations are based on the information you share with us. They are career guidance, not a guarantee of any specific job.'}
      </div>
    </div>
  )
}

export function AssessmentInner() {
  return <AssessmentContent />
}
