'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useTheme } from 'next-themes'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Navbar() {
  const [mounted, setMounted] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const locale = useLocale()
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!mounted) return (
    <header className="h-16 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 fixed top-0 z-50" />
  )

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur shadow-sm' : 'bg-white dark:bg-gray-900'
    } border-b border-gray-200 dark:border-gray-800`}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`/${locale}`} className="font-bold text-xl text-blue-600">
          CareerHub
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href={`/${locale}/careers`} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
            {locale === 'ar' ? 'المسارات المهنية' : 'Career Paths'}
          </Link>
          <Link href={`/${locale}/coaches`} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
            {locale === 'ar' ? 'المدربون' : 'Coaches'}
          </Link>
          <Link href={`/${locale}/pricing`} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
            {locale === 'ar' ? 'الأسعار' : 'Pricing'}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ☰
          </button>
          <LanguageSwitcher />
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link href={`/${locale}/login`} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-medium">
            {locale === 'ar' ? 'تسجيل الدخول' : 'Login'}
          </Link>
        </div>
      </div>
      {menuOpen ? (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 space-y-2">
          <Link href={`/${locale}/careers`} onClick={() => setMenuOpen(false)} className="block text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
            {locale === 'ar' ? 'المسارات المهنية' : 'Career Paths'}
          </Link>
          <Link href={`/${locale}/coaches`} onClick={() => setMenuOpen(false)} className="block text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
            {locale === 'ar' ? 'المدربون' : 'Coaches'}
          </Link>
          <Link href={`/${locale}/pricing`} onClick={() => setMenuOpen(false)} className="block text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors">
            {locale === 'ar' ? 'الأسعار' : 'Pricing'}
          </Link>
        </div>
      ) : null}
    </header>
  )
}
