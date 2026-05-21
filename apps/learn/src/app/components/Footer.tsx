// ==========================================
// File: src/app/components/Footer.tsx
// ==========================================
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, ExternalLink } from 'lucide-react'

const MAIN_SITE_URL = process.env.NEXT_PUBLIC_MAIN_URL || 'https://deveway-teal.vercel.app'

export function Footer() {
  const locale = useLocale()
  const t = useTranslations('footer')

  const links = {
    platform: [
      { href: `/${locale}/courses`, label: t('courses') },
      { href: `/${locale}/coaches`, label: t('coaching') },
      { href: `/${locale}/careers`, label: t('career_paths') },
      { href: `/${locale}/pricing`, label: t('pricing') },
    ],
    support: [
      { href: `/${locale}/help`, label: t('help_center') },
      { href: `/${locale}/contact`, label: t('contact') },
      { href: `/${locale}/faq`, label: t('faq') },
    ],
    legal: [
      { href: `/${locale}/terms`, label: t('terms') },
      { href: `/${locale}/privacy`, label: t('privacy') },
    ],
  }

  return (
    <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href={`/${locale}`} className="inline-flex items-center gap-2.5 group">
              <Image src="/logo-icon.png" alt="DeveWay" width={32} height={32} loading="lazy" />
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
                DeveWay
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              {t('description')}
            </p>

            <div className="mt-6 flex gap-3">
              {[
                { icon: Facebook, href: '#' },
                { icon: Twitter, href: '#' },
                { icon: Instagram, href: '#' },
                { icon: Youtube, href: '#' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                  style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-subtle)'; e.currentTarget.style.color = 'var(--primary)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--muted)' }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--foreground)' }}>
              {t('platform')}
            </h3>
            <ul className="space-y-2.5">
              {links.platform.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors inline-flex items-center gap-1 hover:text-primary"
                    style={{ color: 'var(--muted)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--foreground)' }}>
              {t('support')}
            </h3>
            <ul className="space-y-2.5">
              {links.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm transition-colors hover:text-primary"
                    style={{ color: 'var(--muted)' }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--foreground)' }}>
              {t('contact')}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:support@masarak.com"
                  className="flex items-center gap-2.5 text-sm transition-colors hover:text-primary"
                  style={{ color: 'var(--muted)' }}
                >
                  <Mail className="h-4 w-4" style={{ color: 'var(--info)' }} />
                  <span>support@masarak.com</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+966500000000"
                  className="flex items-center gap-2.5 text-sm transition-colors hover:text-primary"
                  style={{ color: 'var(--muted)' }}
                  dir="ltr"
                >
                  <Phone className="h-4 w-4" style={{ color: 'var(--info)' }} />
                  <span>+966 50 000 0000</span>
                </a>
              </li>
              <li className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--muted)' }}>
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--info)' }} />
                <span>{t('address')}</span>
              </li>
            </ul>

            {/* Main Site Link */}
            <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <a
                href={`${MAIN_SITE_URL}/${locale}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm transition-colors hover:underline"
                style={{ color: 'var(--primary)' }}
              >
                {t('main_site')}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            © {new Date().getFullYear()} DeveWay. {t('all_rights')}
          </p>
          <div className="flex gap-6">
            {links.legal.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm transition-colors hover:text-primary"
                style={{ color: 'var(--muted)' }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}