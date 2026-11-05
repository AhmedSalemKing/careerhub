'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { learnUrlWithToken } from '../../lib/learn-link'
import { useAuthStore } from '../../stores/authStore'

export function Footer() {
  const tNav = useTranslations('nav')
  const t = useTranslations('footer')
  const user = useAuthStore((s) => s.user)

  return (
    <footer className="dw-footer">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-icon.png"
              alt="DeveWay"
              width={28}
              height={28}
              loading="lazy"
              style={{ background: 'transparent' }}
            />
            <span style={{
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: 18,
              color: 'var(--night-ink)',
            }}>
              DeveWay
            </span>
          </div>
          <p className="dw-footer-text mt-3 text-sm">{t('about')}</p>
        </div>

        <div>
          <div className="dw-footer-title">{tNav('careers')}</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link className="footer-link" href="/careers">
                {tNav('careers')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div className="dw-footer-title">{tNav('training')}</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a className="footer-link" href={learnUrlWithToken('/')} target="_blank" rel="noopener noreferrer">
                {t('all_courses')}
              </a>
            </li>
            <li>
              <a
                className="footer-link"
                href={learnUrlWithToken('/my-courses')}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('my_courses')}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <div className="dw-footer-title">{tNav('coaches')}</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link className="footer-link" href="/coaching">
                {tNav('coaches')}
              </Link>
            </li>
            {!user && (
              <li>
                <Link className="footer-link" href="/login">
                  {tNav('login')}
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="dw-footer-bottom">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm dw-footer-text sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>{t('rights')}</div>
          <div className="flex items-center gap-4">
            <Link className="footer-link" href="/privacy">
              {t('privacy')}
            </Link>
            <Link className="footer-link" href="/terms">
              {t('terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}