'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useAuthStore } from '../../../stores/authStore'
import { TypewriterHero } from '../../components/TypewriterHero'

export function HeroSection() {
  const t = useTranslations('hero')
  const locale = useLocale()
  const { user } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])

  const ctaHref = mounted && user
    ? `/${locale}/dashboard/assessment`
    : `/${locale}/register`

  return (
    <section 
      className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden hero-section"
      style={{
        backgroundColor: 'var(--hero-bg)',
        color: 'var(--hero-fg)'
      }}
    >
      
      {/* ════════════════════════════════════════
          BACKGROUND LAYERS
         ════════════════════════════════════════ */}
      
      {/* Layer 1: Grid Pattern */}
      <div className="hero-grid-pattern absolute inset-0 z-0 pointer-events-none" />
      
      {/* Layer 2: Radial Gradient Overlay */}
      <div className="hero-radial-overlay absolute inset-0 z-[1] pointer-events-none" />

      {/* Layer 3: Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[2]">
        <div 
          className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px] animate-float hero-orb-purple"
          style={{ animationDelay: '0s' }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full blur-[80px] animate-float hero-orb-teal"
          style={{ animationDelay: '2s' }}
        />
      </div>

      {/* ════════════════════════════════════════
          CONTENT LAYER
         ════════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-5xl mx-auto px-4 w-full">
        
        {/* Badge */}
        <div 
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8 border backdrop-blur-sm shadow-lg animate-fade-down hero-badge"
          style={{
            borderColor: 'var(--hero-border)',
            backgroundColor: 'var(--hero-badge-bg)'
          }}
        >
          <Sparkles className="h-4 w-4" style={{ color: '#F5A623' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--hero-muted)' }}>
            {t('badge')}
          </span>
        </div>

        {/* Heading */}
        <h1 className="leading-tight mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <span 
            className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-2 drop-shadow-lg"
            style={{ 
              fontFamily: 'PingARLT, Arial Black, sans-serif',
              color: 'var(--hero-fg)'
            }}
          >
            {locale === 'ar' ? 'اكتشف مسارك المهني مع' : 'Discover your career path with'}
          </span>
          
          <span 
            className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl bg-clip-text text-transparent hero-gradient-text"
            style={{ fontFamily: 'PingARLT, Arial Black, sans-serif' }}
          >
            <TypewriterHero />
          </span>
        </h1>

        <p 
          className="mt-2 text-lg sm:text-xl max-w-2xl leading-relaxed animate-fade-up font-sans"
          style={{ 
            animationDelay: '0.2s',
            color: 'var(--hero-muted)'
          }}
        >
          {t('subtitle')}
        </p>

        <div 
          className="mt-10 flex flex-col sm:flex-row gap-4 animate-fade-up w-full sm:w-auto" 
          style={{ animationDelay: '0.3s' }}
        >
          <Link 
            href={ctaHref} 
            className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 hero-cta-primary"
          >
            <span>{t('cta_primary')}</span>
            <svg 
              className="w-5 h-5 transition-transform duration-200 group-hover:-translate-x-1 rtl:group-hover:translate-x-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2.5}
            >
              {locale === 'ar' ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              )}
            </svg>
          </Link>

          <a
            href="#features"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold transition-all duration-200 rounded-xl hero-cta-secondary"
          >
            {t('cta_secondary')}
          </a>
        </div>

        {/* Stats Card */}
        <div className="mt-16 w-full max-w-3xl animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="relative group">
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div 
              className="relative overflow-hidden rounded-2xl border backdrop-blur-xl shadow-2xl p-6 sm:p-8 hero-stats-card"
              style={{
                background: 'var(--hero-card-bg)',
                borderColor: 'var(--hero-border)'
              }}
            >
              <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 text-center">
                
                <div className="flex flex-col items-center">
                  <span className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--hero-fg)' }}>
                    150+
                  </span>
                  <span className="mt-1 text-sm font-medium" style={{ color: 'var(--hero-muted)' }}>
                    {t('stat_courses')}
                  </span>
                </div>

                <div className="hidden sm:block w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                <div className="flex flex-col items-center">
                  <span className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--hero-fg)' }}>
                    40+
                  </span>
                  <span className="mt-1 text-sm font-medium" style={{ color: 'var(--hero-muted)' }}>
                    {t('stat_coaches')}
                  </span>
                </div>

                <div className="hidden sm:block w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                <div className="flex flex-col items-center">
                  <span className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: 'var(--hero-fg)' }}>
                    10,000+
                  </span>
                  <span className="mt-1 text-sm font-medium" style={{ color: 'var(--hero-muted)' }}>
                    {t('stat_students')}
                  </span>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>

      <style jsx global>{`
        /* ════════════════════════════════════════
           HERO SECTION — THEME VARIABLES
           ════════════════════════════════════════ */
        
        .hero-section {
          --hero-bg: #0D0D0D;
          --hero-fg: #F8F8FA;
          --hero-muted: #9CA3AF;
          --hero-border: rgba(255, 255, 255, 0.1);
          --hero-badge-bg: rgba(255, 255, 255, 0.05);
          --hero-card-bg: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%);
          --hero-gradient-from: #818CF8;
          --hero-gradient-via: #A78BFA;
          --hero-gradient-to: #2DD4BF;
          --orb-purple: rgba(88, 28, 135, 0.3);
          --orb-teal: rgba(20, 184, 166, 0.25);
          --cta-primary-bg: #5120c8;
          --cta-primary-hover: #4318a8;
          --cta-primary-shadow: rgba(99, 102, 241, 0.5);
          --cta-secondary-border: rgba(255, 255, 255, 0.2);
          --cta-secondary-hover-bg: rgba(255, 255, 255, 0.05);
          
          /* Grid Variables */
          --grid-line-color: rgba(255, 255, 255, 0.06);
          --grid-line-accent: rgba(255, 255, 255, 0.12);
          --grid-size: 60px;
          --radial-color: rgba(13, 13, 13, 0.8);
        }

        :root:not(.dark) .hero-section {
          --hero-bg: #F8F8FA;
          --hero-fg: #1B2340;
          --hero-muted: #6B7280;
          --hero-border: rgba(27, 35, 64, 0.15);
          --hero-badge-bg: rgba(81, 32, 200, 0.08);
          --hero-card-bg: linear-gradient(180deg, #FFFFFF 0%, #F8F8FA 100%);
          --hero-gradient-from: #5120c8;
          --hero-gradient-via: #7C3AED;
          --hero-gradient-to: #2BBFA3;
          --orb-purple: rgba(81, 32, 200, 0.1);
          --orb-teal: rgba(43, 191, 163, 0.1);
          --cta-primary-bg: #5120c8;
          --cta-primary-hover: #4318a8;
          --cta-primary-shadow: rgba(81, 32, 200, 0.25);
          --cta-secondary-border: rgba(27, 35, 64, 0.25);
          --cta-secondary-hover-bg: rgba(27, 35, 64, 0.05);
          
          /* Grid Variables - Light Mode */
          --grid-line-color: rgba(27, 35, 64, 0.08);
          --grid-line-accent: rgba(81, 32, 200, 0.1);
          --grid-size: 50px;
          --radial-color: rgba(248, 248, 250, 0.9);
        }

        /* ════════════════════════════════════════
           GRID PATTERN
           ════════════════════════════════════════ */
        
        .hero-grid-pattern {
          background-size: var(--grid-size) var(--grid-size);
          
          background-image: 
            linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line-color) 1px, transparent 1px),
            linear-gradient(to right, var(--grid-line-accent) 1px, transparent 1px),
            linear-gradient(to bottom, var(--grid-line-accent) 1px, transparent 1px);
          
          background-position: 
            0 0,
            0 0,
            calc(var(--grid-size) * 5) calc(var(--grid-size) * 5),
            calc(var(--grid-size) * 5) calc(var(--grid-size) * 5);
          
          mask-image: radial-gradient(
            ellipse 80% 70% at 50% 50%, 
            black 0%, 
            black 30%,
            transparent 70%
          );
          -webkit-mask-image: radial-gradient(
            ellipse 80% 70% at 50% 50%, 
            black 0%, 
            black 30%,
            transparent 70%
          );
          
          box-shadow: inset 0 0 100px 0 var(--orb-purple);
        }

        /* ════════════════════════════════════════
           RADIAL OVERLAY
           ════════════════════════════════════════ */
        
        .hero-radial-overlay {
          background: radial-gradient(
            ellipse 100% 80% at 50% 50%,
            transparent 0%,
            var(--radial-color) 70%,
            var(--radial-color) 100%
          );
        }

        /* ════════════════════════════════════════
           FLOATING ORBS
           ════════════════════════════════════════ */

        .hero-orb-purple {
          background-color: var(--orb-purple);
        }

        .hero-orb-teal {
          background-color: var(--orb-teal);
        }

        /* ════════════════════════════════════════
           GRADIENT TEXT
           ════════════════════════════════════════ */

        .hero-gradient-text {
          background-image: linear-gradient(
            to right, 
            var(--hero-gradient-from), 
            var(--hero-gradient-via), 
            var(--hero-gradient-to)
          );
        }

        /* ════════════════════════════════════════
           BUTTONS
           ════════════════════════════════════════ */

        .hero-cta-primary {
          background-color: var(--cta-primary-bg) !important;
          color: #FFFFFF !important;
          border: none !important;
          font-family: "PingARLT", "Arial Black", sans-serif !important;
          font-weight: 900 !important;
          box-shadow: 0 4px 14px var(--cta-primary-shadow);
        }
        .hero-cta-primary:hover {
          background-color: var(--cta-primary-hover) !important;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px var(--cta-primary-shadow);
        }

        .hero-cta-secondary {
          background-color: transparent !important;
          color: var(--hero-fg) !important;
          border: 1.5px solid var(--cta-secondary-border) !important;
          font-family: "PingARLT", "Arial Black", sans-serif !important;
          font-weight: 700 !important;
        }
        .hero-cta-secondary:hover {
          background-color: var(--cta-secondary-hover-bg) !important;
          border-color: var(--hero-fg) !important;
          transform: translateY(-2px);
        }

        /* ════════════════════════════════════════
           STATS CARD
           ════════════════════════════════════════ */

        .hero-stats-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hero-stats-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        :root:not(.dark) .hero-stats-card:hover {
          box-shadow: 0 20px 40px rgba(27, 35, 64, 0.12);
        }

        /* ════════════════════════════════════════
           ANIMATIONS
           ════════════════════════════════════════ */

        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, 20px); }
        }
        .animate-float {
          animation: float 10s infinite ease-in-out;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeUp 0.8s ease-out forwards;
          opacity: 0;
        }

        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-down {
          animation: fadeDown 0.8s ease-out forwards;
          opacity: 0;
        }

        /* Smooth theme transitions */
        .hero-section,
        .hero-section *,
        .hero-section *::before,
        .hero-section *::after {
          transition: background-color 0.3s ease, 
                      border-color 0.3s ease, 
                      color 0.3s ease,
                      box-shadow 0.3s ease;
        }
      `}</style>

    </section>
  )
}