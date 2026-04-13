'use client'

import { useTranslations } from 'next-intl'
import { Star } from 'lucide-react'

/* ════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════ */

export function TestimonialsSection() {
  const t = useTranslations('testimonials')

  const items = [
    { name: t('t1_name'), role: t('t1_role'), quote: t('t1_quote') },
    { name: t('t2_name'), role: t('t2_role'), quote: t('t2_quote') },
    { name: t('t3_name'), role: t('t3_role'), quote: t('t3_quote') },
    { name: t('t4_name'), role: t('t4_role'), quote: t('t4_quote') },
  ] as const

  return (
    <section className="testimonials-section">
      
      {/* ═══ Theme Variables ═══ */}
      <style jsx global>{`
        
        /* ─── DARK MODE (Default) ─── */
        .testimonials-section {
          --ts-bg: #0D0D0D;
          --ts-fg: #F8F8FA;
          --ts-muted: rgba(248, 248, 250, 0.55);
          --ts-muted-2: rgba(248, 248, 250, 0.35);
          --ts-border: rgba(255, 255, 255, 0.08);
          --ts-border-hover: rgba(81, 32, 200, 0.25);
          --ts-surface: rgba(255, 255, 255, 0.03);
          --ts-surface-hover: rgba(255, 255, 255, 0.06);
          --ts-card-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          --ts-card-shadow-hover: 0 8px 30px rgba(0, 0, 0, 0.3);
          --ts-star-filled: #F5A623;
          --star-empty: rgba(248, 248, 250, 0.15);
          --ts-quote-mark: rgba(81, 32, 200, 0.25);

          max-width: 1280px;
          margin: 0 auto;
          padding: 80px 24px;
          background: var(--ts-bg);
          border-top: 1px solid var(--ts-border);
          color: var(--ts-fg);
          transition: background-color 0.3s ease,
                      border-color 0.3s ease,
                      color 0.3s ease;
        }

        /* ─── LIGHT MODE ─── */
        :root:not(.dark) .testimonials-section {
          --ts-bg: #FFFFFF;
          --ts-fg: #1B2340;
          --ts-muted: rgba(27, 35, 64, 0.55);
          --ts-muted-2: rgba(27, 35, 64, 0.4);
          --ts-border: rgba(27, 35, 64, 0.1);
          --ts-border-hover: rgba(81, 32, 200, 0.25);
          --ts-surface: #FAFAFB;
          --ts-surface-hover: #F5F5F7;
          --ts-card-shadow: 0 1px 3px rgba(27, 35, 64, 0.06);
          --ts-card-shadow-hover: 0 8px 30px rgba(27, 35, 64, 0.12);
          --ts-star-filled: #F5A623;
          --star-empty: rgba(27, 35, 64, 0.12);
          --ts-quote-mark: rgba(81, 32, 200, 0.08);
        }

        /* ─── Smooth transitions ─── */
        .testimonials-section,
        .testimonials-section *,
        .testimonials-section *::before,
        .testimonials-section *::after {
          transition: background-color 0.3s ease,
                      border-color 0.3s ease,
                      color 0.3s ease,
                      box-shadow 0.3s ease;
        }
      `}</style>

      {/* ═══ Header ═══ */}
      <div className="ts-header">
        <div>
          <span className="ts-badge">
            ★
            {t('badge') || 'Testimonials'}
          </span>
          <h2 className="ts-title">{t('title')}</h2>
        </div>
        <p className="ts-subtitle">{t('subtitle')}</p>
      </div>

      {/* ═══ Cards Grid ═══ */}
      <div className="ts-grid">
        {items.map((it, index) => (
          <figure
            key={it.name}
            className="ts-card"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Quote Mark */}
            <span className="ts-quote-mark">"</span>

            {/* Quote Text */}
            <blockquote className="ts-quote">{`"${it.quote}"`}</blockquote>

            {/* Author & Rating */}
            <figcaption className="ts-footer">
              <div className="ts-author">
                {/* Avatar Placeholder */}
                <div className="ts-avatar" style={{
                  background: `linear-gradient(135deg, 
                    ${index % 2 === 0 ? '#5120c8' : '#2BBFA3'}20, 
                    ${index % 2 === 0 ? '#5120c8' : '#2BBFA3'}08)`
                }}>
                  {it.name.charAt(0)}
                </div>
                <div>
                  <div className="ts-name">{it.name}</div>
                  <div className="ts-role">{it.role}</div>
                </div>
              </div>

              {/* Stars */}
              <div className="ts-stars" aria-label={t('rating_label')}>
                <Star size={14} className="ts-star-filled" />
                <Star size={14} className="ts-star-filled" />
                <Star size={14} className="ts-star-filled" />
                <Star size={14} className="ts-star-filled" />
                <Star size={14} className="ts-star-empty" />
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      {/* ═══ Component Styles ═══ */}
      <style jsx>{`
        
        /* ─── Header ─── */
        .ts-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }

        .ts-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(245, 166, 35, 0.1);
          border: 1px solid rgba(245, 166, 35, 0.2);
          border-radius: 100px;
          padding: 5px 14px;
          margin-bottom: 14px;
          font-size: 11px;
          font-weight: 600;
          color: #F5A623;
          letter-spacing: 0.05em;
          font-family: "DM Sans", sans-serif;
        }

        .ts-title {
          font-family: "PingARLT", "Cairo", sans-serif;
          font-weight: 700;
          font-size: clamp(24px, 3.5vw, 34px);
          color: var(--ts-fg);
          margin: 0;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }

        .ts-subtitle {
          max-width: 480px;
          font-size: 15px;
          color: var(--ts-muted);
          line-height: 1.65;
          font-family: "DM Sans", sans-serif;
          margin: 0;
        }

        /* ─── Grid ─── */
        .ts-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 18px;
        }
        @media (min-width: 768px) {
          .ts-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* ─── Card ─── */
        .ts-card {
          position: relative;
          padding: 28px;
          border-radius: 18px;
          border: 1px solid var(--ts-border);
          background: var(--ts-surface);
          box-shadow: var(--ts-card-shadow);
          overflow: hidden;
          cursor: default;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
                      border-color 0.3s ease,
                      box-shadow 0.3s ease,
                      background 0.3s ease;
          animation: ts-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .ts-card:hover {
          transform: translateY(-4px);
          border-color: var(--ts-border-hover);
          background: var(--ts-surface-hover);
          box-shadow: var(--ts-card-shadow-hover);
        }

        /* ─── Quote Mark Decoration ─── */
        .ts-quote-mark {
          position: absolute;
          top: 16px;
          right: 20px;
          font-size: 72px;
          font-weight: 900;
          font-family: Georgia, serif;
          color: var(--ts-quote-mark);
          line-height: 1;
          pointer-events: none;
          user-select: none;
        }

        /* ─── Quote Text ─── */
        .ts-quote {
          font-size: 14px;
          line-height: 1.75;
          color: var(--ts-fg);
          margin: 0;
          font-family: "DM Sans", sans-serif;
          position: relative;
          z-index: 1;
        }

        /* ─── Footer (Author + Stars) ─── */
        .ts-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid var(--ts-border);
          gap: 16px;
        }

        /* ─── Author Info ─── */
        .ts-author {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ts-avatar {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          color: var(--ts-fg);
          font-family: "Plus Jakarta Sans", sans-serif;
          flex-shrink: 0;
        }

        .ts-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--ts-fg);
          font-family: "Plus Jakarta Sans", sans-serif;
          line-height: 1.3;
        }

        .ts-role {
          font-size: 12px;
          color: var(--ts-muted);
          font-family: "DM Sans", sans-serif;
          margin-top: 2px;
        }

        /* ─── Stars Rating ─── */
        .ts-stars {
          display: flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
        }

        .ts-star-filled {
          color: var(--ts-star-filled);
        }

        .ts-star-empty {
          color: var(--star-empty);
        }

        /* ─── Animation ─── */
        @keyframes ts-reveal {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </section>
  )
}