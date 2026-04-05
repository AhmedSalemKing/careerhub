// ==========================================
// File: src/app/components/Footer.tsx
// ==========================================
'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, ExternalLink } from 'lucide-react'

const MAIN_SITE_URL = process.env.NEXT_PUBLIC_MAIN_URL || ''

export function Footer() {
  const locale = useLocale()

  const links = {
    platform: [
      { href: `/${locale}/courses`, label: locale === 'ar' ? 'الكورسات' : 'Courses' },
      { href: `/${locale}/coaches`, label: locale === 'ar' ? 'الكوتشينج' : 'Coaching' },
      { href: `/${locale}/careers`, label: locale === 'ar' ? 'المسارات المهنية' : 'Career Paths' },
      { href: `/${locale}/pricing`, label: locale === 'ar' ? 'الأسعار' : 'Pricing' },
    ],
    support: [
      { href: `/${locale}/help`, label: locale === 'ar' ? 'مركز المساعدة' : 'Help Center' },
      { href: `/${locale}/contact`, label: locale === 'ar' ? 'تواصل معنا' : 'Contact Us' },
      { href: `/${locale}/faq`, label: locale === 'ar' ? 'الأسئلة الشائعة' : 'FAQ' },
    ],
    legal: [
      { href: `/${locale}/terms`, label: locale === 'ar' ? 'الشروط والأحكام' : 'Terms' },
      { href: `/${locale}/privacy`, label: locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy' },
    ],
  }

  return (
    <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href={`/${locale}`} className="inline-flex items-center gap-2.5 group">
              <img src="/logo-icon.png" alt="DeveWay" style={{ height: 32, width: 'auto' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
                DeveWay
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              {locale === 'ar'
                ? 'منصة متكاملة لتطوير المهارات وبناء المستقبل المهني بأحدث الكورسات والكوتشينج المتخصص.'
                : 'A comprehensive platform for skill development and career building with the latest courses and specialized coaching.'}
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
              {locale === 'ar' ? 'المنصة' : 'Platform'}
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
              {locale === 'ar' ? 'الدعم' : 'Support'}
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
              {locale === 'ar' ? 'تواصل معنا' : 'Contact Us'}
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
                <span>{locale === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}</span>
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
                {locale === 'ar' ? 'الموقع الرئيسي' : 'Main Site'}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            © {new Date().getFullYear()} DeveWay. {locale === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}
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