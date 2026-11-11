'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { learnUrlWithToken } from '../../lib/learn-link'

/*
 * Footer rebuilt from the reference design: brand + three link columns, then a bottom bar.
 * The reference "partners" column no longer lists the training-provider / corporate links
 * or the provider portal, because this site has no pages for them.
 */

const COPY = {
  ar: {
    tagline: 'طريقك المدعوم بالذكاء الاصطناعي إلى خطوتك التالية.',
    learn: 'تعلّم',
    tracks: 'المسارات المهنية',
    assessment: 'التقييم المجاني',
    myLearning: 'تعلّمي',
    partners: 'شراكات',
    mentors: 'للمرشدين',
    mentorPortal: 'بوابة المرشدين',
    company: 'الشركة',
    how: 'كيف نعمل',
    contact: 'تواصل معنا',
    rights: '© 2026 DeveWay · DeveWay جزء من شركة يونيك دايركشن القابضة.',
    disclaimer: 'تقدّم DeveWay الإرشاد المهني والتعلّم، ولا تضمن التوظيف ولا توفّر الوظائف.',
    privacy: 'سياسة الخصوصية',
    terms: 'الشروط والأحكام',
  },
  en: {
    tagline: 'Your AI-powered path to your next step.',
    learn: 'Learn',
    tracks: 'Career tracks',
    assessment: 'Free assessment',
    myLearning: 'My learning',
    partners: 'Partners',
    mentors: 'For mentors',
    mentorPortal: 'Mentor portal',
    company: 'Company',
    how: 'How it works',
    contact: 'Contact us',
    rights: '© 2026 DeveWay · DeveWay is part of Unique Direction Holding.',
    disclaimer: 'DeveWay provides career coaching and learning. It does not guarantee employment or supply jobs.',
    privacy: 'Privacy policy',
    terms: 'Terms',
  },
} as const

export function Footer() {
  const locale = useLocale()
  const c = locale === 'ar' ? COPY.ar : COPY.en
  const base = `/${locale}`

  return (
    <footer className="footer dw-footer">
      <div className="wrap">
        <div className="f-grid">
          <div className="f-brand">
            <Link className="logo" href={base} aria-label="DeveWay">
              <img className="on-light" src="/logo-wordmark-light.webp" alt="DeveWay" />
              <img className="on-dark" src="/logo-wordmark-dark.webp" alt="" />
            </Link>
            <p>{c.tagline}</p>
          </div>

          <div>
            <h4>{c.learn}</h4>
            <ul>
              <li><Link className="footer-link" href={`${base}/careers`}>{c.tracks}</Link></li>
              <li><Link className="footer-link" href={`${base}/register`}>{c.assessment}</Link></li>
              <li>
                <a className="footer-link" href={learnUrlWithToken('/my-courses')} target="_blank" rel="noopener noreferrer">{c.myLearning}</a>
              </li>
            </ul>
          </div>

          <div>
            <h4>{c.partners}</h4>
            <ul>
              <li><Link className="footer-link" href={`${base}/coaching`}>{c.mentors}</Link></li>
              <li><Link className="footer-link" href={`${base}/coaching#mentor-portal`}>{c.mentorPortal}</Link></li>
            </ul>
          </div>

          <div>
            <h4>{c.company}</h4>
            <ul>
              <li><Link className="footer-link" href={`${base}#how`}>{c.how}</Link></li>
              <li><Link className="footer-link" href={`${base}/contact`}>{c.contact}</Link></li>
            </ul>
          </div>
        </div>

        <div className="f-bottom">
          <span>{c.rights}</span>
          <span>{c.disclaimer}</span>
          <span className="f-legal">
            <Link className="footer-link" href={`${base}/privacy`}>{c.privacy}</Link>
            <Link className="footer-link" href={`${base}/terms`}>{c.terms}</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
