'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useLocale } from 'next-intl'
import { CharacterAvatar } from './CharacterDuo'

const COPY = {
  ar: { title: 'تسجيل الدخول إلى DeveWay', sub: 'اختر طريقة استخدامك لـ DeveWay', close: 'إغلاق', learner: 'أنا متعلّم', coach: 'أنا مرشد', instructor: 'أنا محاضر' },
  en: { title: 'Sign in to DeveWay', sub: 'Choose how you use DeveWay', close: 'Close', learner: "I'm a learner", coach: "I'm a coach", instructor: "I'm an instructor" },
} as const

/** Role picker shown when the header login button is clicked. Learners and instructors still go to /login. */
export function LoginRoleModal({ onClose }: { onClose: () => void }) {
  const locale = useLocale()
  const c = locale === 'ar' ? COPY.ar : COPY.en

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const roles = [
    { id: 'sa2', label: c.learner, href: `/${locale}/login` },
    { id: 'sa5', label: c.coach, href: `/${locale}/coaching` },
    { id: 'sa7', label: c.instructor, href: `/${locale}/login` },
  ] as const

  const modal = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label={c.title} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label={c.close}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
        <div className="modal-body" style={{ paddingTop: '34px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: 800 }}>{c.title}</h2>
          <p className="muted">{c.sub}</p>
          <div className="roles-pick">
            {roles.map((r) => (
              <Link key={r.id + r.label} className="role-btn" href={r.href} onClick={onClose}>
                <CharacterAvatar id={r.id} size={48} />
                <span>{r.label}</span>
                <svg className="icon flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
  return typeof document === 'undefined' ? null : createPortal(modal, document.body)
}
