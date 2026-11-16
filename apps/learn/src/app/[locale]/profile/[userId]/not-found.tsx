'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'

export default function InstructorNotFound() {
  const locale = useLocale()
  const isAr = locale === 'ar'
  return (
    <main
      dir={isAr ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#0D0A1F] flex flex-col items-center justify-center px-4 text-center"
    >
      <svg width="112" height="112" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.2" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
        <path d="M17 3l4 4M21 3l-4 4" strokeLinecap="round" />
      </svg>
      <h1 className="text-3xl font-bold text-white mt-6">{isAr ? 'المحاضر غير موجود' : 'Instructor not found'}</h1>
      <p className="text-gray-400 mt-2">{isAr ? 'هذا الملف الشخصي غير متاح' : 'This profile is not available'}</p>
      <Link
        href={`/${locale}/courses`}
        className="mt-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 font-semibold transition-colors"
      >
        {isAr ? 'تصفح الكورسات' : 'Browse Courses'}
      </Link>
    </main>
  )
}
