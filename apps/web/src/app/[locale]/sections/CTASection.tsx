'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useAuthStore } from '../../../stores/authStore'
import { Sparkles, ArrowRight, Rocket, Zap } from 'lucide-react'

export function CTASection() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('cta')
  const token = useAuthStore((s) => s.token)

  // Hide section entirely if user is logged in
  if (token) return null

  return (
    <section className="cta-section">
      <div className="cta-container">
        <div className="cta-inner">
          {/* Background decorations */}
          <div className="cta-glow cta-glow-1" />
          <div className="cta-glow cta-glow-2" />
          
          {/* Grid pattern overlay */}
          <div className="cta-grid-pattern" />

          <div className="cta-content">
            {/* Badge */}
            <div className="cta-badge">
              <Rocket className="w-4 h-4" />
              <span>{locale === 'ar' ? 'ابدأ رحلتك الآن' : 'Start Your Journey Now'}</span>
            </div>

            <h2 className="cta-title">
              {t('title')}
            </h2>
            
            <p className="cta-subtitle">
              {t('subtitle')}
            </p>

            <div className="cta-buttons">
              <Link 
                href={`/${locale}/register`} 
                className="cta-btn-primary"
              >
                <Zap className="w-4 h-4" />
                {t('primary')}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
              
              <Link 
                href={`/${locale}/careers`} 
                className="cta-btn-secondary"
              >
                {t('secondary')}
              </Link>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="cta-decorations">
            <div className="cta-dot cta-dot-1" />
            <div className="cta-dot cta-dot-2" />
            <div className="cta-dot cta-dot-3" />
            <div className="cta-line cta-line-1" />
            <div className="cta-line cta-line-2" />
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* ════════════════════════════════════════
           CTA SECTION — THEME VARIABLES
           ════════════════════════════════════════ */
        
        .cta-section {
          --cta-bg: #0D0D0D;
          --cta-fg: #F8F8FA;
          --cta-muted: rgba(248, 248, 250, 0.65);
          --cta-border: rgba(81, 32, 200, 0.2);
          --cta-accent: #5120c8;
          --cta-accent-hover: #4318a8;
          --cta-glow: rgba(81, 32, 200, 0.15);
          --cta-surface: rgba(255, 255, 255, 0.04);
          --cta-shadow: 0 0 60px rgba(81, 32, 200, 0.1);

          max-width: 1280px;
          margin: 0 auto;
          padding: 0 16px 56px;
        }

        :root:not(.dark) .cta-section {
          --cta-bg: #FFFFFF;
          --cta-fg: #1B2340;
          --cta-muted: rgba(27, 35, 64, 0.65);
          --cta-border: rgba(81, 32, 200, 0.2);
          --cta-accent: #5120c8;
          --cta-accent-hover: #4318a8;
          --cta-glow: rgba(81, 32, 200, 0.08);
          --cta-surface: rgba(27, 35, 64, 0.03);
          --cta-shadow: 0 0 60px rgba(81, 32, 200, 0.06);
        }

        .cta-container {
          position: relative;
        }

        .cta-inner {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          padding: 48px 56px;
          background: var(--cta-bg);
          border: 1px solid var(--cta-border);
          box-shadow: var(--cta-shadow);
          transition: all 0.4s ease;
        }
        .cta-inner:hover {
          border-color: rgba(81, 32, 200, 0.35);
          box-shadow: var(--cta-shadow), 0 0 80px rgba(81, 32, 200, 0.08);
        }

        /* Glow effects */
        .cta-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
        }
        .cta-glow-1 {
          width: 300px;
          height: 300px;
          background: var(--cta-glow);
          top: -100px;
          right: -50px;
          opacity: 0.8;
        }
        .cta-glow-2 {
          width: 250px;
          height: 250px;
          background: rgba(43, 191, 163, 0.08);
          bottom: -80px;
          left: -40px;
          opacity: 0.6;
        }

        /* Grid pattern */
        .cta-grid-pattern {
          position: absolute;
          inset: 0;
          background-size: 40px 40px;
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 0%, transparent 100%);
          pointer-events: none;
          z-index: 0;
        }
        :root:not(.dark) .cta-grid-pattern {
          background-image:
            linear-gradient(to right, rgba(27, 35, 64, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(27, 35, 64, 0.04) 1px, transparent 1px);
        }

        /* Content */
        .cta-content {
          position: relative;
          z-index: 1;
          max-width: 640px;
        }

        /* Badge */
        .cta-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--cta-surface);
          border: 1px solid var(--cta-border);
          border-radius: 100px;
          padding: 8px 18px;
          margin-bottom: 20px;
          font-size: 13px;
          font-weight: 600;
          color: var(--cta-accent);
          font-family: "DM Sans", sans-serif;
          backdrop-filter: blur(10px);
        }

        /* Title */
        .cta-title {
          font-family: "Plus Jakarta Sans", sans-serif;
          font-weight: 700;
          font-size: clamp(24px, 3.5vw, 34px);
          letter-spacing: -0.02em;
          color: var(--cta-fg);
          margin: 0 0 16px;
          line-height: 1.2;
        }

        /* Subtitle */
        .cta-subtitle {
          font-size: clamp(14px, 1.8vw, 16px);
          line-height: 1.7;
          color: var(--cta-muted);
          font-family: "DM Sans", sans-serif;
          margin: 0 0 28px;
        }

        /* Buttons */
        .cta-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .cta-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: var(--cta-accent) !important;
          color: #FFFFFF !important;
          font-family: "PingARLT", "Arial Black", sans-serif !important;
          font-weight: 900 !important;
          font-size: 15px !important;
          padding: 14px 32px !important;
          border-radius: 14px !important;
          border: none !important;
          text-decoration: none;
          transition: all 0.25s ease !important;
          box-shadow: 0 4px 20px rgba(81, 32, 200, 0.3);
        }
        .cta-btn-primary:hover {
          background: var(--cta-accent-hover) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(81, 32, 200, 0.4);
          gap: 14px !important;
        }

        .cta-btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: transparent !important;
          color: var(--cta-fg) !important;
          font-family: "PingARLT", "Arial Black", sans-serif !important;
          font-weight: 700 !important;
          font-size: 15px !important;
          padding: 14px 28px !important;
          border-radius: 14px !important;
          border: 1.5px solid var(--cta-border) !important;
          text-decoration: none;
          transition: all 0.25s ease !important;
        }
        .cta-btn-secondary:hover {
          background: var(--cta-surface) !important;
          border-color: var(--cta-fg) !important;
          transform: translateY(-2px);
        }

        /* Decorative elements */
        .cta-decorations {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .cta-dot {
          position: absolute;
          border-radius: 50%;
          background: var(--cta-accent);
          opacity: 0.15;
        }
        .cta-dot-1 {
          width: 6px;
          height: 6px;
          top: 30%;
          right: 20%;
        }
        .cta-dot-2 {
          width: 4px;
          height: 4px;
          top: 55%;
          right: 15%;
        }
        .cta-dot-3 {
          width: 8px;
          height: 8px;
          bottom: 25%;
          right: 28%;
        }

        .cta-line {
          position: absolute;
          background: linear-gradient(90deg, transparent, var(--cta-border), transparent);
          opacity: 0.3;
        }
        .cta-line-1 {
          width: 120px;
          height: 1px;
          top: 40%;
          right: 8%;
          transform: rotate(-15deg);
        }
        .cta-line-2 {
          width: 80px;
          height: 1px;
          bottom: 35%;
          right: 12%;
          transform: rotate(25deg);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .cta-inner {
            padding: 32px 24px;
            border-radius: 20px;
          }
          .cta-buttons {
            flex-direction: column;
          }
          .cta-btn-primary,
          .cta-btn-secondary {
            width: 100%;
            justify-content: center;
          }
          .cta-decorations {
            display: none;
          }
        }

        /* Transitions */
        .cta-section,
        .cta-section *,
        .cta-section *::before,
        .cta-section *::after {
          transition: background-color 0.3s ease,
                      border-color 0.3s ease,
                      color 0.3s ease,
                      box-shadow 0.3s ease;
        }
      `}</style>
    </section>
  )
}