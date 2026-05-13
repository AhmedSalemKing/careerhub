'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { TRAINING_URL } from '../../lib/constants'

export function Footer() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const tNav = useTranslations('nav')
  const t = useTranslations('footer')

  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: '1200px', margin: '0 auto',
        padding: '3rem 1.5rem 1.5rem',
      }}>

        {/* Top section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '2.5rem',
          marginBottom: '2.5rem',
        }}>

          {/* Brand column */}
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              marginBottom: '1rem',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #5120c8, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 900, color: '#fff', fontSize: '1rem',
              }}>
                D
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--foreground)' }}>
                DeveWay
              </span>
            </div>
            <p style={{
              color: 'var(--muted-foreground)', fontSize: '0.85rem',
              lineHeight: 1.7, maxWidth: '280px', margin: '0 0 1.25rem',
            }}>
              {t('about')}
            </p>
            {/* Social links */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { href: '#', label: 'Twitter/X', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.763l7.727-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                { href: '#', label: 'LinkedIn', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                { href: '#', label: 'Instagram', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
              ].map((social, i) => (
                <a key={i} href={social.href} aria-label={social.label}
                  style={{
                    width: '36px', height: '36px', borderRadius: '9px',
                    background: 'rgba(128,128,128,0.08)',
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--muted-foreground)', textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(81,32,200,0.2)'
                    e.currentTarget.style.borderColor = 'rgba(81,32,200,0.4)'
                    e.currentTarget.style.color = '#a78bfa'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(128,128,128,0.08)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--muted-foreground)'
                  }}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Platform column */}
          <div>
            <h4 style={{
              fontSize: '0.82rem', fontWeight: 700,
              color: 'var(--foreground)',
              margin: '0 0 1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {isAr ? 'المنصة' : 'Platform'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0,
              display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <Link href="/careers" style={{
                  color: 'var(--muted-foreground)', textDecoration: 'none',
                  fontSize: '0.875rem', transition: 'color 0.15s',
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-foreground)'}
                >
                  {tNav('careers')}
                </Link>
              </li>
              <li>
                <Link href="/pricing" style={{
                  color: 'var(--muted-foreground)', textDecoration: 'none',
                  fontSize: '0.875rem', transition: 'color 0.15s',
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-foreground)'}
                >
                  {tNav('pricing')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Training column */}
          <div>
            <h4 style={{
              fontSize: '0.82rem', fontWeight: 700,
              color: 'var(--foreground)',
              margin: '0 0 1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {isAr ? 'التدريب' : 'Training'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0,
              display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <a href={TRAINING_URL} target="_blank" rel="noopener noreferrer" style={{
                  color: 'var(--muted-foreground)', textDecoration: 'none',
                  fontSize: '0.875rem', transition: 'color 0.15s',
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-foreground)'}
                >
                  {t('all_courses')}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    style={{ opacity: 0.5 }}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </li>
              <li>
                <a href={`${TRAINING_URL}/my-courses`} target="_blank" rel="noopener noreferrer" style={{
                  color: 'var(--muted-foreground)', textDecoration: 'none',
                  fontSize: '0.875rem', transition: 'color 0.15s',
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-foreground)'}
                >
                  {t('my_courses')}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    style={{ opacity: 0.5 }}>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </li>
            </ul>
          </div>

          {/* Support column */}
          <div>
            <h4 style={{
              fontSize: '0.82rem', fontWeight: 700,
              color: 'var(--foreground)',
              margin: '0 0 1rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}>
              {isAr ? 'الدعم' : 'Support'}
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0,
              display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <Link href="/coaches" style={{
                  color: 'var(--muted-foreground)', textDecoration: 'none',
                  fontSize: '0.875rem', transition: 'color 0.15s',
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-foreground)'}
                >
                  {tNav('coaches')}
                </Link>
              </li>
              <li>
                <Link href="/login" style={{
                  color: 'var(--muted-foreground)', textDecoration: 'none',
                  fontSize: '0.875rem', transition: 'color 0.15s',
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-foreground)'}
                >
                  {tNav('login')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'var(--border)',
          marginBottom: '1.25rem',
        }}/>

        {/* Bottom bar */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
        }}>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.8rem', margin: 0 }}>
            {t('rights')}
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/privacy" style={{
              color: 'var(--muted-foreground)', textDecoration: 'none',
              fontSize: '0.8rem', transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-foreground)'}
            >
              {t('privacy')}
            </Link>
            <Link href="/terms" style={{
              color: 'var(--muted-foreground)', textDecoration: 'none',
              fontSize: '0.8rem', transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-foreground)'}
            >
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}