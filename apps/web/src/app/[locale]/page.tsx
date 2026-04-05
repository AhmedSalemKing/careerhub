import type { Metadata } from 'next'

import { HeroSection } from './sections/HeroSection'
import { FeaturesSection } from './sections/FeaturesSection'
import { CareerPathsSection } from './sections/CareerPathsSection'
import { TestimonialsSection } from './sections/TestimonialsSection'
import { CTASection } from './sections/CTASection'
import { CoursesShowcase } from '../components/CoursesShowcase'

export const metadata: Metadata = {
  title: 'DeveWay — Discover Your Career Path',
  description:
    'AI-powered career guidance, professional courses, and expert coaching to help you land your first tech job.',
  openGraph: {
    title: 'DeveWay — Discover Your Career Path',
    description:
      'AI-powered career guidance, professional courses, and expert coaching to help you land your first tech job.',
    type: 'website',
  },
}

export default function HomePage() {
  return (
    <main id="main-content" aria-label="DeveWay homepage" className="scroll-smooth">

      {/*
       * ── HERO ──────────────────────────────────────────────────────────────
       * Full-width dark section (#1B2340). No container. ~92vh.
       */}
      <HeroSection />

      {/*
       * ── FEATURES ──────────────────────────────────────────────────────────
       * Light bg. Section has py-14 (56px) internally.
       * Outer py-6 (24px) lifts total vertical padding to 80px per side.
       * border-top separates from hero dark edge.
       */}
      <div className="py-6" style={{ borderTop: '1px solid var(--border)' }}>
        <FeaturesSection />
      </div>

      {/*
       * ── CAREER PATHS ──────────────────────────────────────────────────────
       * Full-width, var(--background). Has own padding: 80px 0 and border-top.
       * No outer wrapper needed — already meets the 80px rhythm target.
       */}
      <CareerPathsSection />

      {/*
       * ── JOURNEY ───────────────────────────────────────────────────────────
       * Full-width dark section (#020617). pt-24/pb-24 (96px) internally.
       * Intentional dark island — no container, no outer spacing.
       */}
      <CoursesShowcase />

      {/*
       * ── TESTIMONIALS ──────────────────────────────────────────────────────
       * Light bg follows dark Journey — needs explicit border-top to signal
       * the mode transition. Section has py-14 (56px); outer py-6 → 80px total.
       */}
      <div className="py-6" style={{ borderTop: '1px solid var(--border)' }}>
        <TestimonialsSection />
      </div>

      {/*
       * ── CTA ───────────────────────────────────────────────────────────────
       * Light bg, contained max-w-7xl block. Separated from Testimonials
       * by a full-width border. Section returns null when user is logged in —
       * wrapper is inert in that case.
       */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <CTASection />
      </div>

    </main>
  )
}
