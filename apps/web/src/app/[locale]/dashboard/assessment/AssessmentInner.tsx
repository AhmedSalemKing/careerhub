'use client'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import dynamic from 'next/dynamic'
import { SECTION_SVGS, SECTION_LABELS, RasheedFigure } from './sections'

const AIInterviewPage = dynamic(() => import('./AIInterviewPage'), { ssr: false })

function AssessmentContent() {
  const quizRef = useRef<HTMLDivElement>(null)
  const [line0Visible, setLine0Visible] = useState(false)
  const [line1Visible, setLine1Visible] = useState(false)
  const [line2Visible, setLine2Visible] = useState(false)
  const [sectionsVisible, setSectionsVisible] = useState(false)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    timers.push(setTimeout(() => setLine0Visible(true), 300))
    timers.push(setTimeout(() => setLine1Visible(true), 700))
    timers.push(setTimeout(() => setLine2Visible(true), 1100))
    timers.push(setTimeout(() => setSectionsVisible(true), 1500))
    return () => timers.forEach(clearTimeout)
  }, [])

  // Single page: intro and quiz both live at /dashboard/assessment. The CTA only scrolls.
  // Interview mode stays hidden (code preserved in AIInterviewPage).
  const handleStart = () => {
    quizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div dir="rtl" className="dw-assess">
      <section className="ri-hero">
        <div className="ri-wrap">
          <div className="ri-center">
            <figure className="r-figure ri-figure">
              <span className="r-blob" aria-hidden="true" />
              <RasheedFigure />
            </figure>

            <div className="ri-lines">
              <p className={`ri-line big${line0Visible ? ' on' : ''}`}>اكتشف مسارك المهني مع رشيد</p>
              <p className={`ri-line${line1Visible ? ' on' : ''}`}>
                أجب على ١٨ سؤالاً وسيحلل رشيد مهاراتك وشخصيتك وطموحاتك
              </p>
              <p className={`ri-line${line2Visible ? ' on' : ''}`}>
                ثم يقترح عليك أفضل المسارات المهنية المناسبة لك
              </p>
            </div>

            <div className="ri-cta">
              <button type="button" className="dw-as-cta" onClick={handleStart}>
                ابدأ التقييم مع رشيد
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            <div className={`ri-secs${sectionsVisible ? ' on' : ''}`}>
              <ol>
                {SECTION_LABELS.map((label, i) => (
                  <li key={label} style={{ '--d': `${i * 70}ms` } as CSSProperties}>
                    <span className="sb-ic">{SECTION_SVGS[i]}</span>
                    <span><b>{i + 1}</b> {label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <div ref={quizRef} id="assess-q" className="assess-q">
        <div className="dw-as-title">
          <span className="dw-as-eyebrow dark">نحو 15-20 دقيقة</span>
          <h2>التقييم المهني المجاني مع رشيد</h2>
        </div>
        <AIInterviewPage mode="quiz" embedded />
      </div>

      <div className="dw-as-note">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        التوصيات مبنية على المعلومات التي تشاركها معنا، وهي إرشاد مهني وليست ضماناً لوظيفة معينة.
      </div>
    </div>
  )
}

export function AssessmentInner() {
  return <AssessmentContent />
}
