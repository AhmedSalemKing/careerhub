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
          CONTENT LAYER - Split Layout (Text Left | Image Right)
         ════════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* CENTERED BADGE - Above Everything */}
        <div 
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 mb-6 lg:mb-10 border backdrop-blur-sm shadow-lg animate-fade-down hero-badge"
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

        {/* Main Content Container - Split Layout */}
        <div className="flex flex-col lg:flex-row-reverse items-center justify-center gap-8 lg:gap-12 xl:gap-16 w-full">
        
        {/* LEFT COLUMN: Text Content - MOBILE: Order 2 (Below Image) */}
        <div className="flex-1 flex flex-col items-center text-center lg:text-left max-w-2xl order-2 lg:order-1">

        {/* Heading */}
        <h1 className="leading-tight mb-3 lg:mb-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <span 
            className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mb-2 drop-shadow-lg"
            style={{ 
              fontFamily: 'PingARLT, Arial Black, sans-serif',
              color: 'var(--hero-fg)'
            }}
          >
            {t('title')}
          </span>
          
          <span 
            className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl bg-clip-text text-transparent hero-gradient-text"
            style={{ fontFamily: 'PingARLT, Arial Black, sans-serif' }}
          >
            <TypewriterHero />
          </span>
        </h1>

        <p 
          className="mt-1.5 text-sm sm:text-base lg:text-lg max-w-xl lg:max-w-2xl leading-relaxed animate-fade-up font-sans"
          style={{ 
            animationDelay: '0.2s',
            color: 'var(--hero-muted)'
          }}
        >
          {t('subtitle')}
        </p>

        <div 
          className="mt-5 lg:mt-6 flex flex-col sm:flex-row gap-2.5 lg:gap-3 animate-fade-up w-full sm:w-auto" 
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

        {/* Stats Card - Simple & Compact Design - CENTERED */}
        <div className="mt-8 lg:mt-10 w-full max-w-lg lg:max-w-xl mx-auto animate-fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="relative group">
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div 
              className="relative overflow-hidden rounded-xl border backdrop-blur-md shadow-lg p-3 sm:p-4 hero-stats-card stats-card-compact"
              style={{
                background: 'var(--hero-card-bg)',
                borderColor: 'var(--hero-border)'
              }}
            >
              <div className="flex flex-nowrap justify-center items-center gap-4 sm:gap-6 lg:gap-8 text-center">
                
                <div className="flex flex-col items-center flex-shrink-0">
                  <span className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight" style={{ color: 'var(--hero-fg)' }}>
                    150+
                  </span>
                  <span className="mt-0.5 text-xs font-medium whitespace-nowrap" style={{ color: 'var(--hero-muted)' }}>
                    {t('stat_courses')}
                  </span>
                </div>

                <div className="w-px h-8 bg-white/15 flex-shrink-0" />

                <div className="flex flex-col items-center flex-shrink-0">
                  <span className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight" style={{ color: 'var(--hero-fg)' }}>
                    40+
                  </span>
                  <span className="mt-0.5 text-xs font-medium whitespace-nowrap" style={{ color: 'var(--hero-muted)' }}>
                    {t('stat_coaches')}
                  </span>
                </div>

                <div className="w-px h-8 bg-white/15 flex-shrink-0" />

                <div className="flex flex-col items-center flex-shrink-0">
                  <span className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight" style={{ color: 'var(--hero-fg)' }}>
                    10,000+
                  </span>
                  <span className="mt-0.5 text-xs font-medium whitespace-nowrap" style={{ color: 'var(--hero-muted)' }}>
                    {t('stat_students')}
                  </span>
                </div>

              </div>
            </div>
          </div>
        </div>

        </div>

        {/* RIGHT COLUMN: Hero Image - RAISED UP - MOBILE: Order 1 (Above Text) */}
        <div className="relative flex-shrink-0 w-full max-w-md lg:max-w-lg xl:max-w-xl flex justify-center lg:justify-start -mt-4 lg:-mt-12 order-1 lg:order-2">
          <div className="relative hero-image-container">
            {/* Decorative glow behind image */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-violet-500/20 to-teal-500/20 rounded-3xl blur-3xl scale-110 animate-pulse-slow" />
            
            {/* Main image with floating animation */}
            <div className="relative animate-float-image">
              <img
                src="/Remove_background_completely_to_create_transparent-1776292610725.png"
                alt="DeveWay Career Platform"
                className="w-full h-auto max-w-[280px] sm:max-w-[320px] md:max-w-[380px] lg:max-w-[420px] xl:max-w-[480px] object-contain drop-shadow-2xl hero-main-image"
                loading="eager"
              />
            </div>

            {/* Floating decorative elements around image - NO ORANGE DOT */}
            <div className="absolute -bottom-6 -right-6 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 blur-sm animate-float-decorative" style={{ animationDelay: '1.5s' }} />
            <div className="absolute top-1/2 -right-4 w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 blur-sm animate-float-decorative" style={{ animationDelay: '3s' }} />
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
           STATS CARD - COMPACT & LIGHT DESIGN
           ════════════════════════════════════════ */

        .hero-stats-card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hero-stats-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }
        :root:not(.dark) .hero-stats-card:hover {
          box-shadow: 0 12px 24px rgba(27, 35, 64, 0.1);
        }

        /* Compact & Light Stats Card Styling */
        .stats-card-compact {
          position: relative;
        }

        /* Hero image styling */
        .hero-image-container {
          transition: transform 0.3s ease;
        }
        .hero-image-container:hover {
          transform: scale(1.02);
        }
        
        .hero-main-image {
          transition: filter 0.3s ease, transform 0.3s ease;
        }
        .hero-image-container:hover .hero-main-image {
          filter: brightness(1.05) contrast(1.02);
        }

        /* Responsive adjustments for split layout */
        @media (max-width: 1023px) {
          .hero-section .items-center.lg\\:items-start {
            align-items: center !important;
          }
        }

        @media (min-width: 1024px) {
          .hero-section {
            padding-left: 2rem;
            padding-right: 2rem;
          }
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

        /* Image floating animation - gentler movement */
        @keyframes floatImage {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(0.5deg); }
          66% { transform: translateY(5px) rotate(-0.3deg); }
        }
        .animate-float-image {
          animation: floatImage 6s ease-in-out infinite;
        }

        /* Slow pulse for glow effect */
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.05); }
        }
        .animate-pulse-slow {
          animation: pulseSlow 4s ease-in-out infinite;
        }

        /* Decorative elements floating */
        @keyframes floatDecorative {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.7; }
          50% { transform: translate(5px, -8px) scale(1.1); opacity: 1; }
        }
        .animate-float-decorative {
          animation: floatDecorative 3s ease-in-out infinite;
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