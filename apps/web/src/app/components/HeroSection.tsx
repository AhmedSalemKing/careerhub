'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  Play, Users, BookOpen, Star, Clock, ArrowRight,
  Award, Globe, Code, Palette,
  BarChart3, Briefcase, Sparkles
} from 'lucide-react'
import { TypewriterHero } from './TypewriterHero' // استيراد مكون الآلة الكاتبة
// import { CareerPathsSection } from '../components/CareerPathsSection' // تم التعطيل لتجنب الأخطاء
// import { Button } from '../components/ui/button' // تم الاستغناء عنه لتجنب أخطاء الـ Typescript
import { get } from '../../lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''
const MAIN_SITE_URL = process.env.NEXT_PUBLIC_MAIN_URL || ''

function thumbUrl(path?: string | null): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return path.startsWith('/') ? path : `/${path}`
}

export default function HomePage() {
  const t = useTranslations()
  const locale = useLocale() as 'ar' | 'en'
  const [showStickyCta, setShowStickyCta] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const [apiCourses, setApiCourses] = useState<any[]>([])

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = heroRef.current?.offsetHeight || 0
      setShowStickyCta(window.scrollY > heroHeight * 0.5)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    get('/courses?limit=6&language=' + locale)
      .then((res) => {
        const d = (res as any)?.data?.data ?? (res as any)?.data
        const courses = d?.courses ?? (Array.isArray(d) ? d : [])
        setApiCourses(courses.slice(0, 6))
      })
      .catch(() => setApiCourses([]))
  }, [locale])

  const categories = [
    { icon: Code, name: { ar: 'البرمجة', en: 'Programming' }, count: 45, bg: 'rgba(81,32,200,0.12)', color: '#5120c8' },
    { icon: Palette, name: { ar: 'التصميم', en: 'Design' }, count: 32, bg: 'rgba(43,191,163,0.12)', color: '#2BBFA3' },
    { icon: BarChart3, name: { ar: 'التسويق الرقمي', en: 'Digital Marketing' }, count: 28, bg: 'rgba(245,166,35,0.12)', color: '#F5A623' },
    { icon: Briefcase, name: { ar: 'إدارة الأعمال', en: 'Business' }, count: 35, bg: 'rgba(27,35,64,0.12)', color: '#0D0D0D' },
  ]

  const featuredCourses = apiCourses.slice(0, 3).map((c: any, i: number) => ({
    id: c.id,
    title: typeof c.title === 'string' ? c.title : (locale === 'ar' ? c.titleAr || c.titleEn : c.titleEn || c.titleAr) || 'Course',
    duration: c.duration || 0,
    students: c._count?.enrollments || 0,
    rating: 4.7 + i * 0.1,
    price: c.price ?? 0,
    badge: c.isMostPopular ? (locale === 'ar' ? 'الأكثر طلباً' : 'Popular') : i === 1 ? (locale === 'ar' ? 'جديد' : 'New') : null,
    badgeBg: c.isMostPopular ? '#F5A623' : '#2BBFA3',
    thumbnail: c.thumbnail,
  }))

  return (
    <div className="min-h-screen">
      {/* ========== HERO ========== */}
            {/* ========== HERO ========== */}
      <section
        ref={heroRef}
        className="relative min-h-[92vh] text-white overflow-hidden"
        style={{ background: 'var(--navy)' }} /* الخلفية السوداء/الزرقاء */
      >
        {/* 1. شبكة الخطوط (الخلفية التقنية) */}
        <div className="hero-grid-pattern"></div>

        {/* 2. الكرات الغائمة (الإضاءة الخلفية) - مهم أن تكون فوق الشبكة */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
          <div
            className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full animate-float"
            style={{ background: 'rgba(81,32,200,0.06)', filter: 'blur(100px)' }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full animate-float"
            style={{ background: 'rgba(43,191,163,0.05)', filter: 'blur(80px)', animationDelay: '2s' }}
          />
        </div>

        {/* 3. المحتوى (النصوص والأزرار) - يجب أن يكون في المقدمة z-10 */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-[92vh] mx-auto max-w-3xl px-4">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm mb-6 border border-white/10 bg-white/5 text-white/80 backdrop-blur-md">
            <Sparkles className="h-4 w-4" style={{ color: '#F5A623' }} />
            <span>{locale === 'ar' ? 'أكثر من 10,000 متعلم حققوا أهدافهم' : 'Over 10,000 learners achieved their goals'}</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold font-madinet leading-tight animate-fade-up stagger-1">
            {locale === 'ar' ? 'تعلم مهارة' : 'Learn a Skill'}
            <span className="block mt-2" style={{ color: '#A78BFA' }}>
              {locale === 'ar' ? 'غيّر مستقبلك' : 'Change Your Future'}
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg sm:text-xl max-w-2xl animate-fade-up stagger-2" style={{ color: 'rgba(248,248,250,0.65)' }}>
            {locale === 'ar'
              ? 'منصة تعليمية متكاملة مع كورسات احترافية وكوتشينج شخصي لمساعدتك على تحقيق أهدافك المهنية'
              : 'A comprehensive learning platform with professional courses and personal coaching'}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 animate-fade-up stagger-3">
            <a
              href={`${MAIN_SITE_URL}/${locale}/register`}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-8 py-4 text-base font-bold text-white transition-all duration-200 hover:shadow-lg"
              style={{
                background: '#5120c8',
                fontFamily: locale === 'ar' ? "'alfont_com_PingARLT-Black', sans-serif" : 'inherit',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(81,32,200,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {locale === 'ar' ? 'ابدأ مجاناً الآن' : 'Start Free Now'}
              <ArrowRight className="h-5 w-5" style={{ transform: locale === 'ar' ? 'scaleX(-1)' : 'none' }} />
            </a>
            
            <Link
              href={`/${locale}/courses`}
              className="inline-flex items-center gap-2 text-base font-semibold rounded-xl px-8 py-3.5 transition-all duration-200 border border-white/20 hover:bg-white/5"
              style={{
                color: '#F8F8FA',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                textDecoration: 'none',
              }}
            >
              {locale === 'ar' ? 'تصفح الكورسات' : 'Browse Courses'}
            </Link>
          </div>

          {/* Stats strip */}
          <div className="mt-12 w-full max-w-2xl animate-fade-up stagger-4">
            <div
              className="rounded-2xl p-5 border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl sm:text-3xl font-bold">150+</p>
                  <p className="text-sm text-white/60">{locale === 'ar' ? 'كورس احترافي' : 'Professional Courses'}</p>
                </div>
                <div className="border-l border-r border-white/10">
                  <p className="text-2xl sm:text-3xl font-bold">50+</p>
                  <p className="text-sm text-white/60">{locale === 'ar' ? 'مدرب خبير' : 'Expert Instructors'}</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold">10K+</p>
                  <p className="text-sm text-white/60">{locale === 'ar' ? 'متعلم نشط' : 'Active Learners'}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========== JOURNEY / CAREER PATHS (Placeholder) ========== */}
      <div className="py-20 text-center" style={{ color: 'var(--muted)', background: 'var(--background)' }}>
         {/* يمكنك إلغاء التعليق بعد التأكد من المسار الصحيح للمكون */}
         {/* <CareerPathsSection /> */}
         <p className="text-sm opacity-50">{locale === 'ar' ? '(قسم المسارات المهنية - تعطيل مؤقت)' : '(Career Paths Section - Temporarily Disabled)'}</p>
      </div>

      {/* ========== COURSES ========== */}
      <section style={{ background: 'var(--background)' }} className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
            <div>
              <span className="inline-block text-sm font-medium mb-2" style={{ color: 'var(--primary)' }}>
                {locale === 'ar' ? 'الأكثر طلباً' : 'Most Popular'}
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold font-madinet" style={{ color: 'var(--foreground)' }}>
                {locale === 'ar' ? 'الكورسات المميزة' : 'Featured Courses'}
              </h2>
            </div>
            <Link
              href={`/${locale}/courses`}
              className="inline-flex items-center gap-2 text-sm font-semibold shrink-0 px-4 py-2 rounded-xl transition-all duration-200"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)' }}
            >
              {locale === 'ar' ? 'عرض الكل' : 'View All'}
              <ArrowRight className="h-4 w-4" style={{ transform: locale === 'ar' ? 'scaleX(-1)' : 'none' }} />
            </Link>
          </div>

          {featuredCourses.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--muted)' }}>
              {locale === 'ar' ? 'جاري تحميل الكورسات...' : 'Loading courses...'}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course, index) => (
              <div
                key={course.id}
                className="group relative rounded-xl overflow-hidden card-hover"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="relative aspect-video overflow-hidden" style={{ background: 'var(--navy)' }}>
                  {thumbUrl(course.thumbnail) ? (
                    <img
                      src={thumbUrl(course.thumbnail)!}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-5xl">{['💻', '🌐', '📊'][index]}</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="h-6 w-6" style={{ color: 'var(--navy)', transform: 'translateX(2px)' }} />
                    </div>
                  </div>

                  {course.badge && (
                    <div
                      className="absolute top-3 right-3 rtl:right-auto rtl:left-3 px-3 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ background: course.badgeBg }}
                    >
                      {course.badge}
                    </div>
                  )}

                  <div
                    className="absolute bottom-3 right-3 rtl:right-auto rtl:left-3 px-2 py-1 rounded text-xs text-white flex items-center gap-1"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                  >
                    <Clock className="h-3 w-3" />
                    {course.duration}h
                  </div>
                </div>

                <div className="p-5">
                  <h3
                    className="text-lg font-bold mb-3 line-clamp-2 transition-colors"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {typeof course.title === 'string' ? course.title : ''}
                  </h3>

                  <div className="flex items-center gap-4 text-sm mb-4" style={{ color: 'var(--muted)' }}>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{course.students.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4" style={{ color: '#F5A623', fill: '#F5A623' }} />
                      <span className="font-medium">{course.rating}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
                      {course.price}
                      <span className="text-sm font-normal ml-1" style={{ color: 'var(--muted)' }}>
                        {locale === 'ar' ? 'ر.س' : 'SAR'}
                      </span>
                    </div>
                    <Link
                      href={`/${locale}/courses/${course.id}`}
                      className="btn-primary"
                      style={{ fontSize: 13, padding: '8px 16px' }}
                    >
                      {locale === 'ar' ? 'التحقق الآن' : 'Enroll'}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Categories */}
          <div className="mt-16">
            <h3 className="text-xl font-bold text-center mb-6 font-madinet" style={{ color: 'var(--foreground)' }}>
              {locale === 'ar' ? 'تصفح حسب المجال' : 'Browse by Category'}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category, index) => (
                <Link
                  key={index}
                  href={`/${locale}/courses?category=${index}`}
                  className="group flex items-center gap-4 p-4 rounded-xl card-hover"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div
                    className="shrink-0 h-12 w-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: category.bg }}
                  >
                    <category.icon className="h-6 w-6" style={{ color: category.color }} />
                  </div>
                  <div>
                    <h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                      {category.name[locale]}
                    </h4>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      {category.count} {locale === 'ar' ? 'كورس' : 'Courses'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section
        className="relative py-24 text-white overflow-hidden"
        style={{ background: 'var(--navy)' }}
      >
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm mb-6"
            style={{
              background: 'rgba(248,248,250,0.07)',
              border: '1px solid rgba(248,248,250,0.12)',
              color: 'rgba(248,248,250,0.8)',
            }}
          >
            <Globe className="h-4 w-4" />
            <span>{locale === 'ar' ? 'شهادات معتمدة عالمياً' : 'Globally Certified'}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold font-madinet">
            {locale === 'ar' ? 'جاهز تبدأ رحلتك؟' : 'Ready to Start?'}
          </h2>
          <p className="mt-4 text-lg" style={{ color: 'rgba(248,248,250,0.65)' }}>
            {locale === 'ar'
              ? 'انضم لآلاف المتعلمين وابدأ في تطوير مهاراتك اليوم'
              : 'Join thousands of learners and start today'}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`${MAIN_SITE_URL}/${locale}/register`}
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-8 py-4 text-base font-bold text-white transition-all duration-200 hover:shadow-lg"
              style={{
                background: '#5120c8',
                fontFamily: locale === 'ar' ? "'alfont_com_PingARLT-Black', sans-serif" : 'inherit',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(81,32,200,0.3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              {locale === 'ar' ? 'ابدأ مجاناً الآن' : 'Start Free Now'}
              <ArrowRight className="h-5 w-5" style={{ transform: locale === 'ar' ? 'scaleX(-1)' : 'none' }} />
            </a>
            <Link
              href={`/${locale}/courses`}
              className="inline-flex items-center gap-2 text-base font-semibold rounded-xl px-8 py-3.5 transition-all duration-200"
              style={{
                background: 'transparent',
                border: '1.5px solid rgba(248,248,250,0.25)',
                color: '#F8F8FA',
                textDecoration: 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {locale === 'ar' ? 'تصفح الكورسات' : 'Browse Courses'}
            </Link>
          </div>
        </div>
      </section>

      {/* ========== STICKY CTA ========== */}
      <div className={`floating-cta ${showStickyCta ? 'visible' : ''}`}>
        <a
          href={`${MAIN_SITE_URL}/${locale}/register`}
          className="btn-primary w-full justify-center"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          {locale === 'ar' ? 'ابدأ التعلم الآن' : 'Start Learning Now'}
          <ArrowRight className="h-4 w-4" style={{ transform: locale === 'ar' ? 'scaleX(-1)' : 'none' }} />
        </a>
      </div>
    </div>
  )
}