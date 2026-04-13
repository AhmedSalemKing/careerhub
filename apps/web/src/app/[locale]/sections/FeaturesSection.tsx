'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Target, GraduationCap, Users, ChevronRight, Sparkles } from 'lucide-react'
import { TRAINING_URL } from '../../../lib/constants'

/* ════════════════════════════════════════
   DATA
   ════════════════════════════════════════ */

const FEATURES = [
  {
    id: 1,
    icon: <Target size={20} />,
    iconBg: 'linear-gradient(135deg, #5120c8, #7C3AED)',
    titleAr: 'تحديد المسار المهني',
    titleEn: 'Career Path AI',
    descAr: 'اختبار ذكي + تحليل AI + توصيات مخصصة لمسارك المهني',
    descEn: 'Smart test + AI analysis + personalized career recommendations',
    ctaAr: 'ابدأ',
    ctaEn: 'Start',
    href: '/dashboard/assessment', // ← صفحة الاختبار
    color: '#5120c8',
    isExternal: false,
  },
  {
    id: 2,
    icon: <GraduationCap size={20} />,
    iconBg: 'linear-gradient(135deg, #0D9488, #2DD4BF)',
    titleAr: 'منصة التدريب',
    titleEn: 'Training Platform',
    descAr: 'كورسات فيديو، جلسات لايف، وشهادات معتمدة',
    descEn: 'Video courses, live sessions & certified certificates',
    ctaAr: 'تصفح',
    ctaEn: 'Browse',
    href: TRAINING_URL, // ← دومين خارجي (تاب جديد)
    color: '#0D9488',
    isExternal: true, // ← يفتح في تاب جديد
  },
  {
    id: 3,
    icon: <Users size={20} />,
    iconBg: 'linear-gradient(135deg, #D97706, #FBBF24)',
    titleAr: 'الكوتشينج',
    titleEn: 'Coaching',
    descAr: 'احجز جلسة مع كوتش متخصص عبر Zoom',
    descEn: 'Book a session with an expert coach via Zoom',
    ctaAr: 'احجز',
    ctaEn: 'Book',
    href: '/dashboard/coaching', // ← صفحة الكوتشينج الصحيحة
    color: '#D97706',
    isExternal: false,
  },
]

/* ════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════ */

export function FeaturesSection() {
  const t = useTranslations('features')
  const locale = useLocale()
  const isAr = locale === 'ar'
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [imgError, setImgError] = useState(false)

  // Detect when section is visible
  useEffect(() => {
    const el = ref.current
    if (!el) return
    
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true)
          obs.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    checkTheme()
    
    window.addEventListener('storage', checkTheme)
    
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })
    return () => {
      observer.disconnect()
      window.removeEventListener('storage', checkTheme)
    }
  }, [])

  const screenImage = isDark ? '/Screen/Light.png' : '/Screen/Dark.png'

  return (
    <section id="features" ref={ref} className="features-section">
      
      {/* ═══ Background Effects ═══ */}
      <div className="fx-glow fx-glow-1" />
      <div className="fx-glow fx-glow-2" />
      <div className="fx-grid-pattern" />

      {/* ═══ Container ═══ */}
      <div className="fx-container">

        {/* ── Header ── */}
        <div className={`fx-header ${show ? 'fx-visible' : ''}`}>
          <span className="fx-badge">
            <Sparkles className="w-3 h-3" />
            {isAr ? 'لماذا نحن' : 'Why Us'}
          </span>
          
          <h2 className="fx-title fx-pingarlt">
            {isAr ? 'أدوات لبناء مستقبلك المهني' : 'Tools to Build Your Career Future'}
          </h2>
          
          <p className="fx-subtitle">
            {t('subtitle') || (isAr 
              ? 'منصة متكاملة تجمع بين التوجيه الذكي والتدريب العملي' 
              : 'An integrated platform combining smart guidance and practical training')}
          </p>
        </div>

        {/* ── Main Content: Phone + Cards ── */}
        <div className="fx-main">

          {/* ═══ LEFT: PHONE MOCKUP ═══ */}
          <div className={`fx-phone-wrapper ${show ? 'fx-phone-show' : ''}`}>
            <div className="phone-float">
              
              <div className="phone-frame">
                <div className="phone-btn phone-btn-1" />
                <div className="phone-btn phone-btn-2" />
                <div className="phone-btn phone-btn-3" />
                <div className="phone-btn phone-btn-4" />

                <div className="phone-notch">
                  <div className="phone-camera" />
                  <div className="phone-speaker" />
                </div>

                <div className="phone-screen">
                  {!imgError ? (
                    <img
                      key={screenImage}
                      src={screenImage}
                      alt="DeveWay App"
                      className="phone-img"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="phone-fallback fx-pingarlt">
                      <Sparkles size={36} strokeWidth={1.5} />
                      <span>DeveWay</span>
                    </div>
                  )}
                </div>

                <div className="home-indicator" />
              </div>

              <div className="phone-glow" />
            </div>
          </div>

          {/* ═══ RIGHT: FEATURE CARDS ═══ */}
          <div className="fx-cards-stack">

            {FEATURES.map((feature, index) => {
              // ← تحديد نوع الرابط بناءً على isExternal
              if (feature.isExternal) {
                // رابط خارجي → يفتح في تاب جديد
                return (
                  <div
                    key={feature.id}
                    className={`feature-card-wrapper ${show ? 'fx-card-show' : ''}`}
                    style={{ animationDelay: `${index * 0.18}s` }}
                  >
                    <a
                      href={feature.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="feature-card"
                    >
                      
                      <div
                        className="feature-icon"
                        style={{ background: feature.iconBg }}
                      >
                        {feature.icon}
                      </div>

                      <div className="feature-text">
                        <div className="feature-text-header">
                          <h3 className="feature-title fx-pingarlt">
                            {isAr ? feature.titleAr : feature.titleEn}
                          </h3>
                          <span className="feature-arrow">
                            <ChevronRight size={14} />
                          </span>
                        </div>
                        
                        <p className="feature-desc">
                          {isAr ? feature.descAr : feature.descEn}
                        </p>
                      </div>

                      <div className="feature-cta fx-pingarlt-bold">
                        {isAr ? feature.ctaAr : feature.ctaEn}
                        <svg className="w-3 h-3 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>

                    </a>
                  </div>
                )
              }

              // رابط داخلي → Next.js Link
              return (
                <div
                  key={feature.id}
                  className={`feature-card-wrapper ${show ? 'fx-card-show' : ''}`}
                  style={{ animationDelay: `${index * 0.18}s` }}
                >
                  <Link href={feature.href} className="feature-card">
                    
                    <div
                      className="feature-icon"
                      style={{ background: feature.iconBg }}
                    >
                      {feature.icon}
                    </div>

                    <div className="feature-text">
                      <div className="feature-text-header">
                        <h3 className="feature-title fx-pingarlt">
                          {isAr ? feature.titleAr : feature.titleEn}
                        </h3>
                        <span className="feature-arrow">
                          <ChevronRight size={14} />
                        </span>
                      </div>
                      
                      <p className="feature-desc">
                        {isAr ? feature.descAr : feature.descEn}
                      </p>
                    </div>

                    <div className="feature-cta fx-pingarlt-bold">
                      {isAr ? feature.ctaAr : feature.ctaEn}
                    </div>

                  </Link>
                </div>
              )
            })}

          </div>
        </div>
      </div>

      {/* ═══ STYLES ═══ */}
      <style jsx global>{`
        
        /* ========================================
           FONTS — PingARLT Force Load
           ======================================== */
        
        @font-face {
          font-family: 'PingARLT';
          src: url('/fonts/alfont_com_PingARLT-Black.otf') format('opentype');
          font-weight: 900;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: 'PingARLT';
          src: url('/fonts/PingARLT-Black.ttf') format('truetype');
          font-weight: 900;
          font-style: normal;
          font-display: swap;
        }

        .fx-pingarlt {
          font-family: 'PingARLT', 'Arial Black', sans-serif !important;
          font-weight: 900 !important;
          letter-spacing: -0.02em !important;
        }

        .fx-pingarlt-bold {
          font-family: 'PingARLT', 'Arial Black', sans-serif !important;
          font-weight: 900 !important;
          letter-spacing: 0.02em !important;
        }

        /* ========================================
           SECTION VARIABLES
           ======================================== */
        
        .features-section {
          --fx-bg: #0A0A0B;
          --fx-fg: #FAFAFA;
          --fx-muted: #71717A;
          --fx-border: rgba(255,255,255,0.08);
          --fx-card-bg: rgba(255,255,255,0.03);
          --fx-card-border: rgba(255,255,255,0.12);
          --fx-primary: #5120c8;
          --fx-glow-color: rgba(81,32,200,0.12);

          position: relative;
          padding: 90px 24px;
          background: var(--fx-bg);
          color: var(--fx-fg);
          overflow: hidden;
          border-top: 1px solid var(--fx-border);
          transition: background-color 0.35s ease, color 0.35s ease;
        }

        :root:not(.dark) .features-section {
          --fx-bg: #FAFAF9;
          --fx-fg: #09090B;
          --fx-muted: #6B7280;
          --fx-border: rgba(0,0,0,0.06);
          --fx-card-bg: rgba(0,0,0,0.02);
          --fx-card-border: rgba(0,0,0,0.08);
          --fx-glow-color: rgba(81,32,200,0.08);
        }

        .fx-container {
          max-width: 1100px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        /* ========================================
           HEADER
           ======================================== */
        
        .fx-header {
          text-align: center;
          margin-bottom: 64px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        .fx-header.fx-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .fx-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 100px;
          background: rgba(81,32,200,0.1);
          border: 1px solid rgba(81,32,200,0.18);
          font-size: 11px;
          font-weight: 600;
          color: var(--fx-primary);
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-bottom: 16px;
          font-family: "DM Sans", sans-serif;
        }

        .fx-title {
          font-family: 'PingARLT', 'Arial Black', sans-serif !important;
          font-weight: 900 !important;
          font-size: clamp(28px, 4.5vw, 42px) !important;
          letter-spacing: -0.03em !important;
          color: var(--fx-fg);
          margin: 0 0 14px;
          line-height: 1.15;
        }

        .fx-subtitle {
          font-size: 15px;
          color: var(--fx-muted);
          max-width: 480px;
          margin: 0 auto;
          line-height: 1.65;
          font-family: "DM Sans", sans-serif;
        }

        /* ========================================
           LAYOUT
           ======================================== */

        .fx-main {
          display: grid;
          grid-template-columns: 340px 1fr;
          align-items: center;
          gap: 60px;
        }

        @media (max-width: 900px) {
          .fx-main {
            grid-template-columns: 1fr;
            gap: 56px;
          }
          .fx-phone-wrapper { order: -1; }
        }

        @media (max-width: 480px) {
          .features-section { padding: 60px 16px; }
        }

        /* ========================================
           PHONE MOCKUP
           ======================================== */

        .fx-phone-wrapper {
          display: flex;
          justify-content: center;
          opacity: 0;
          transform: scale(0.75) translateY(50px);
          transition: opacity 0.85s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.85s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .fx-phone-wrapper.fx-phone-show {
          opacity: 1;
          transform: scale(1) translateY(0);
        }

        .phone-float {
          position: relative;
          animation: phoneFloat 5s ease-in-out infinite;
        }

        @keyframes phoneFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        .phone-frame {
          width: 260px;
          height: 520px;
          background: linear-gradient(145deg, #1a1a1e, #0d0d10);
          border-radius: 44px;
          padding: 10px;
          position: relative;
          box-shadow:
            0 25px 80px rgba(0,0,0,0.55),
            0 10px 30px rgba(0,0,0,0.35),
            inset 0 1px 0 rgba(255,255,255,0.08),
            inset 0 -1px 0 rgba(0,0,0,0.3);
        }

        :root:not(.dark) .phone-frame {
          background: linear-gradient(145deg, #f0f0f2, #e4e4e8);
          box-shadow:
            0 25px 80px rgba(27,35,64,0.18),
            0 10px 30px rgba(27,35,64,0.12),
            inset 0 1px 0 rgba(255,255,255,0.9),
            inset 0 -1px 0 rgba(0,0,0,0.08);
        }

        .phone-btn {
          position: absolute;
          width: 3px;
          border-radius: 2px;
          background: linear-gradient(180deg, #333, #555, #333);
          z-index: 5;
        }

        :root:not(.dark) .phone-btn {
          background: linear-gradient(180deg, #ccc, #999, #ccc);
        }

        .phone-btn-1 { height: 50px; top: 120px; right: -3.5px; border-radius: 3px 0 0 3px; }
        .phone-btn-2 { height: 34px; top: 105px; left: -3.5px; border-radius: 0 3px 3px 0; }
        .phone-btn-3 { height: 34px; top: 148px; left: -3.5px; border-radius: 0 3px 3px 0; }
        .phone-btn-4 { height: 50px; top: 180px; right: -3.5px; border-radius: 3px 0 0 3px; }

        .phone-notch {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          width: 95px;
          height: 28px;
          background: #000;
          border-radius: 18px;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        :root:not(.dark) .phone-notch { background: #111; }

        .phone-camera {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #1a1a2e, #0a0a15);
          box-shadow: inset 0 0 2px rgba(100,150,255,0.2);
        }

        .phone-speaker {
          width: 42px; height: 4px;
          border-radius: 2px;
          background: #1a1a1a;
        }

        :root:not(.dark) .phone-speaker { background: #ddd; }

        .phone-screen {
          width: 100%;
          height: 100%;
          border-radius: 36px;
          overflow: hidden;
          background: #000;
          position: relative;
        }

        .phone-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
          border-radius: 36px;
          display: block;
        }

        .phone-fallback {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: rgba(81,32,200,0.7);
          font-size: 20px;
          background: linear-gradient(180deg, rgba(81,32,200,0.03), transparent);
        }

        .home-indicator {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 4px;
          border-radius: 2px;
          background: rgba(255,255,255,0.3);
          z-index: 10;
        }

        .phone-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 280px;
          height: 280px;
          background: radial-gradient(circle, var(--fx-glow-color), transparent 70%);
          filter: blur(50px);
          pointer-events: none;
          z-index: -1;
        }

        /* ========================================
           FEATURE CARDS
           ======================================== */

        .fx-cards-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feature-card-wrapper {
          opacity: 0;
          transform: translateX(40px) translateY(12px);
          animation: cardReveal 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-play-state: paused;
        }

        .feature-card-wrapper.fx-card-show {
          animation-play-state: running;
        }

        @keyframes cardReveal {
          to { opacity: 1; transform: translateX(0) translateY(0); }
        }

        /* ← الرابط العام (Link أو a) */
        .feature-card {
          position: relative;
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          border-radius: 20px;
          background: var(--fx-card-bg);
          border: 1.5px solid var(--fx-card-border);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          text-decoration: none;
          color: var(--fx-fg);
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          cursor: pointer;
        }

        .feature-card:hover {
          transform: scale(1.03) translateY(-2px);
          border-color: rgba(81,32,200,0.35);
          box-shadow: 0 12px 40px rgba(0,0,0,0.2);
        }

        :root:not(.dark) .feature-card:hover {
          box-shadow: 0 12px 40px rgba(27,35,64,0.15);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          min-width: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 14px rgba(0,0,0,0.25);
          transition: transform 0.35s ease;
        }

        .feature-card:hover .feature-icon {
          transform: scale(1.08) rotate(-4deg);
        }

        .feature-text {
          flex: 1;
          min-width: 0;
        }

        .feature-text-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 4px;
        }

        .feature-title {
          font-family: 'PingARLT', 'Arial Black', sans-serif !important;
          font-weight: 900 !important;
          font-size: 16px !important;
          color: var(--fx-fg);
          margin: 0;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }

        .feature-arrow {
          display: flex;
          align-items: center;
          color: var(--fx-primary);
          opacity: 0;
          transform: translateX(-8px);
          transition: all 0.3s ease;
        }

        [dir="rtl"] .feature-arrow {
          transform: translateX(8px);
        }

        .feature-card:hover .feature-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .feature-desc {
          font-size: 13px;
          color: var(--fx-muted);
          line-height: 1.55;
          margin: 0;
          font-family: "DM Sans", sans-serif;
        }

        .feature-cta {
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 11px;
          font-family: 'PingARLT', 'Arial Black', sans-serif !important;
          font-weight: 900 !important;
          background: rgba(81,32,200,0.1);
          color: var(--fx-primary);
          border: 1px solid rgba(81,32,200,0.2);
          white-space: nowrap;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .feature-card:hover .feature-cta {
          background: var(--fx-primary);
          color: #fff;
          border-color: var(--fx-primary);
        }

        /* ========================================
           BACKGROUND EFFECTS
           ======================================== */

        .fx-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
        }

        .fx-glow-1 {
          width: 450px; height: 450px;
          background: rgba(81, 32, 200, 0.1);
          top: -150px; right: -100px;
        }

        .fx-glow-2 {
          width: 350px; height: 350px;
          background: rgba(43, 191, 163, 0.07);
          bottom: -100px; left: -80px;
        }

        .fx-grid-pattern {
          position: absolute;
          inset: 0;
          background-size: 50px 50px;
          background-image:
            linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px);
          mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 0%, transparent 100%);
          pointer-events: none;
          z-index: 0;
        }

        :root:not(.dark) .fx-grid-pattern {
          background-image:
            linear-gradient(to right, rgba(27,35,64,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(27,35,64,0.04) 1px, transparent 1px);
        }

        .features-section *,
        .features-section *::before,
        .features-section *::after {
          transition-property: background-color, border-color, color, box-shadow;
          transition-duration: 0.35s ease;
        }

        .feature-card,
        .feature-icon,
        .feature-cta,
        .feature-arrow {
          transition-property: all;
        }
      `}</style>
    </section>
  )
}