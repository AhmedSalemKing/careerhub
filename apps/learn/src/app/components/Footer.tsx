// ==========================================
// File: src/app/components/Footer.tsx
// ==========================================
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { ExternalLink } from 'lucide-react'

const MAIN_SITE_URL = process.env.NEXT_PUBLIC_MAIN_URL || 'https://deveway-teal.vercel.app'
const LEARN_SITE_URL = 'https://devewayhub.vercel.app'

export function Footer() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  const main = `${MAIN_SITE_URL}/${locale}`

  const sections: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
    {
      title: isAr ? 'المسارات المهنية' : 'Career paths',
      links: [{ href: `${main}/careers`, label: isAr ? 'المسارات المهنية' : 'Career paths' }],
    },
    {
      title: isAr ? 'التدريب' : 'Training',
      links: [
        { href: `${LEARN_SITE_URL}/${locale}/courses`, label: isAr ? 'جميع الكورسات' : 'All courses', external: true },
        { href: `${main}/dashboard/my-courses`, label: isAr ? 'كورساتي' : 'My courses', external: true },
      ],
    },
    {
      title: isAr ? 'الكوتشينج' : 'Coaching',
      links: [{ href: `${main}/coaching`, label: isAr ? 'الكوتشينج' : 'Coaching' }],
    },
  ]

  const legal = [
    { href: `${main}/privacy`, label: isAr ? 'سياسة الخصوصية' : 'Privacy policy' },
    { href: `${main}/terms`, label: isAr ? 'الشروط والأحكام' : 'Terms and conditions' },
  ]

  return (
    <footer style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <a href={main} className="inline-flex items-center gap-2.5 group">
              <Image src="/logo-icon.png" alt="DeveWay" width={32} height={32} loading="lazy" />
              <span style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
                DeveWay
              </span>
            </a>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              {isAr
                ? 'DeveWay منصة عربية تجمع بين التوجيه المهني والكوتشينج، مع تدريب مستقل على نطاق منفصل.'
                : 'DeveWay is an Arabic platform combining career guidance and coaching, with training on its own separate domain.'}
            </p>
          </div>

          {/* Links */}
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--foreground)' }}>
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-sm transition-colors inline-flex items-center gap-1 hover:text-primary"
                      style={{ color: 'var(--muted)' }}
                    >
                      {link.label}
                      {link.external && <ExternalLink className="h-3 w-3" />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            © {new Date().getFullYear()} DeveWay
          </p>
          <div className="flex gap-6">
            {legal.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm transition-colors hover:text-primary"
                style={{ color: 'var(--muted)' }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
