'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { learnUrlWithToken } from '../../../lib/learn-link'

/* ════════════════════════════════════════
   DATA
   ════════════════════════════════════════ */

const FEATURES = [
  {
    id: 1,
    titleKey: 'career_title' as const,
    descKey: 'career_desc' as const,
    ctaKey: 'career_cta' as const,
    href: '/dashboard/assessment',
    isExternal: false,
  },
  {
    id: 2,
    titleKey: 'training_title' as const,
    descKey: 'training_desc' as const,
    ctaKey: 'training_cta' as const,
    href: learnUrlWithToken('/'),
    isExternal: true,
  },
  {
    id: 3,
    titleKey: 'coaching_title' as const,
    descKey: 'coaching_desc' as const,
    ctaKey: 'coaching_cta' as const,
    href: '/dashboard/coaching',
    isExternal: false,
  },
]

/* ════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════ */

export function FeaturesSection() {
  const t = useTranslations('features')
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [imgError, setImgError] = useState(false)

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

  const renderFeatureCard = (feature: typeof FEATURES[number], positionClass: string) => {
    const className = `fx-card ${positionClass} ${show ? 'fx-card-show' : ''}`

    const content = (
      <>
        <h3 className="fx-card-title">{t(feature.titleKey)}</h3>
        <p className="fx-card-desc">{t(feature.descKey)}</p>
        <span className="fx-card-cta">
          {t(feature.ctaKey)}
          <span className="fx-card-arrow" aria-hidden="true">←</span>
        </span>
      </>
    )

    return feature.isExternal ? (
      <a href={feature.href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    ) : (
      <Link href={feature.href} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <section id="features" ref={ref} className="features-section">
      
      {/* ═══ Background Effects ═══ */}
      <div className="fx-glow fx-glow-1" />
      <div className="fx-glow fx-glow-2" />
      <div className="fx-blur fx-blur-1" />
      <div className="fx-blur fx-blur-2" />

      {/* ═══ Container ═══ */}
      <div className="fx-container">

        {/* ── Header ── */}
        <div className={`fx-header ${show ? 'fx-visible' : ''}`}>
          <h2 className="fx-title fx-pingarlt">
            {t('title')}
          </h2>

          <p className="fx-subtitle">
            {t('subtitle')}
          </p>
        </div>

        {/* ── Main Content: Centered Phone with Cards Left / Right / Below ── */}
        <div className="fx-main">

          {/* ═══ LEFT CARD ═══ */}
          {renderFeatureCard(FEATURES[0], 'fx-card-left')}

          {/* ═══ CENTER: PHONE MOCKUP ═══ */}
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

              <div className="phone-shadow" />
              <div className="phone-glow" />
            </div>
          </div>

          {/* ═══ RIGHT CARD ═══ */}
          {renderFeatureCard(FEATURES[1], 'fx-card-right')}

          {/* ═══ BOTTOM CARD ═══ */}
          {renderFeatureCard(FEATURES[2], 'fx-card-bottom')}
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
          font-weight: 700 !important;
          letter-spacing: -0.02em !important;
        }

        .fx-pingarlt-bold {
          font-family: 'PingARLT', 'Arial Black', sans-serif !important;
          font-weight: 700 !important;
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
          padding: 40px 24px 56px;
          /* DARK MODE (default) — deeper dark purple gradient */
          background: linear-gradient(180deg, #0B0618 0%, #150A2E 50%, #0B0618 100%);
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
          --fx-card-bg: rgba(255,255,255,0.75);
          --fx-card-border: rgba(81,32,200,0.08);
          --fx-glow-color: rgba(81,32,200,0.08);

          background: linear-gradient(180deg, #FAFAFF 0%, #F3F0FF 100%);
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

        .fx-title {
          font-family: 'PingARLT', 'Arial Black', sans-serif !important;
          font-weight: 700 !important;
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
           LAYOUT - Centered phone with side cards + bottom card
           ======================================== */

        .fx-main {
          position: relative;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          grid-template-areas:
            "left phone right"
            ".    bottom .";
          gap: 24px 32px;
          align-items: center;
          justify-items: center;
          direction: ltr; /* keep physical left/right mapping so connectors line up */
          max-width: 1000px;
          margin: 0 auto;
          padding: 24px 24px 40px;
        }

        /* ← في RTL: نرجع اتجاه النص للعربي داخل الكاردز والهيدر */
        [dir="rtl"] .fx-card,
        [dir="rtl"] .fx-header {
          direction: rtl;
        }

        /* ── Card positions around the phone ── */
        .fx-card-left   { grid-area: left;   justify-self: end;   max-width: 320px; min-width: 280px; }
        .fx-card-right  { grid-area: right;  justify-self: start; max-width: 320px; min-width: 280px; }
        .fx-card-bottom { grid-area: bottom; justify-self: center; max-width: 420px; }
        .fx-phone-wrapper { grid-area: phone; justify-self: center; }

        /* ── Curved dotted purple connectors (card pseudo-elements) ── */
        .fx-card-left::after {
          content: '';
          position: absolute;
          top: 50%;
          right: -42px;
          width: 42px;
          height: 50px;
          border-top: 1.5px dashed #C4B5FD;
          border-right: 1.5px dashed #C4B5FD;
          border-top-right-radius: 100%;
          transform: translateY(-100%);
          opacity: 0.7;
          pointer-events: none;
        }

        .fx-card-right::after {
          content: '';
          position: absolute;
          top: 50%;
          left: -42px;
          width: 42px;
          height: 50px;
          border-top: 1.5px dashed #C4B5FD;
          border-left: 1.5px dashed #C4B5FD;
          border-top-left-radius: 100%;
          transform: translateY(-100%);
          opacity: 0.7;
          pointer-events: none;
        }

        .fx-card-bottom::before {
          content: '';
          position: absolute;
          top: -28px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 28px;
          border-left: 1.5px dashed #C4B5FD;
          opacity: 0.7;
          pointer-events: none;
        }

        .fx-card-bottom::after {
          content: '';
          position: absolute;
          top: -32px;
          left: 50%;
          transform: translateX(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #A78BFA;
          pointer-events: none;
        }

        /* Tablet & Mobile (<968px): stack everything vertically */
        @media (max-width: 968px) {
          .fx-main {
            grid-template-columns: 1fr;
            grid-template-areas:
              "left"
              "phone"
              "right"
              "bottom";
            gap: 24px;
            padding: 32px 20px 48px;
          }

          .fx-card-left,
          .fx-card-right {
            justify-self: center;
            min-width: 0;
          }

          .fx-card-bottom { max-width: 100%; }

          .fx-card-left::after,
          .fx-card-right::after,
          .fx-card-bottom::before,
          .fx-card-bottom::after {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .features-section { padding: 40px 16px 56px; }
          .phone-frame { width: 200px; height: 410px; }
        }

        /* ========================================
           PHONE MOCKUP
           ======================================== */

        .fx-phone-wrapper {
          display: flex;
          justify-content: center;
          position: relative;
          z-index: 2;
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
          width: 250px;
          height: 510px;
          background: #1a1a1a;
          border-radius: 40px;
          padding: 8px;
          position: relative;
          z-index: 2;
          box-shadow:
            0 14px 40px rgba(81, 32, 200, 0.16),
            0 6px 18px rgba(0, 0, 0, 0.1);
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
          border-radius: 30px;
          overflow: hidden;
          background: #000;
          position: relative;
        }

        .phone-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: top center;
          border-radius: 30px;
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

        /* Strong soft shadow underneath the phone (visible on light bg) */
        .phone-shadow {
          position: absolute;
          bottom: -18px;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 36px;
          background: radial-gradient(
            ellipse at center,
            rgba(81, 32, 200, 0.28) 0%,
            rgba(81, 32, 200, 0.1) 40%,
            transparent 75%
          );
          filter: blur(16px);
          pointer-events: none;
          z-index: 1;
        }

        /* ========================================
           FEATURE CARDS (compact, no icons)
           ======================================== */

        .fx-card {
          position: relative;
          z-index: 1;
          display: block;
          width: 100%;
          padding: 20px 22px 18px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow:
            0 8px 32px rgba(81, 32, 200, 0.06),
            0 2px 8px rgba(0, 0, 0, 0.03);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          text-decoration: none;
          color: var(--fx-fg);
          opacity: 0;
          transform: translateY(16px);
          transition:
            opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.5s cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 0.25s ease,
            background-color 0.35s ease,
            border-color 0.35s ease;
        }

        .fx-card.fx-card-show {
          opacity: 1;
          transform: translateY(0);
        }

        .fx-card:hover {
          transform: translateY(-3px);
          box-shadow:
            0 12px 44px rgba(81, 32, 200, 0.1),
            0 4px 12px rgba(0, 0, 0, 0.04);
        }

        :root:not(.dark) .fx-card {
          background: rgba(255, 255, 255, 0.72);
          border-color: rgba(81, 32, 200, 0.08);
        }

        .fx-card-title {
          font-family: 'PingARLT', 'Arial Black', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: #5120C8;
          margin: 0 0 6px;
          line-height: 1.3;
          letter-spacing: -0.01em;
        }

        .fx-card-desc {
          font-size: 13px;
          line-height: 1.6;
          color: var(--muted);
          margin: 0 0 10px;
        }

        .fx-card-cta {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #5120C8;
          transition: gap 0.2s ease;
        }

        .fx-card-arrow {
          display: inline-block;
          font-size: 15px;
          line-height: 1;
          transition: transform 0.2s ease;
        }

        .fx-card:hover .fx-card-arrow {
          transform: translateX(-3px); /* RTL: arrow points left */
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

        /* Soft purple blur circles */
        .fx-blur {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.35;
          pointer-events: none;
          z-index: 0;
        }

        .fx-blur-1 { top: -10%; left: -10%; width: 500px; height: 500px; background: #5120C8; opacity: 0.18; }
        .fx-blur-2 { bottom: -10%; right: -10%; width: 600px; height: 600px; background: #7C3AED; opacity: 0.15; }

        :root:not(.dark) .fx-blur-1 { background: #DDD6FE; opacity: 0.35; }
        :root:not(.dark) .fx-blur-2 { background: #EDE9FE; opacity: 0.35; }

      `}</style>
    </section>
  )
}