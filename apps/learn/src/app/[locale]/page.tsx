'use client'

import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play, Users, BookOpen, Star, Clock, ArrowRight,
  Award, Globe, Code, Palette,
  BarChart3, Briefcase, Sparkles, Laptop
} from 'lucide-react'
import { CareerPathsSection } from '../components/CareerPathsSection'
import { Button } from '../components/ui/button'
import { get } from '../../lib/api'

const PRODUCTION_API_URL = 'https://deve-way.onrender.com/api'
const API_BASE = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL
  const url = (envUrl && envUrl.trim()) ? envUrl : PRODUCTION_API_URL
  return url.replace(/\/+$/, '')
})()
const MAIN_SITE_URL = (() => {
  const envUrl = process.env.NEXT_PUBLIC_MAIN_URL
  return (envUrl && envUrl.trim()) ? envUrl : 'https://deveway-teal.vercel.app'
})()

function thumbUrl(path?: string | null): string | null {
  if (!path || typeof path !== 'string') return null
  if (path.startsWith('http')) return path
  return path.startsWith('/') ? path : `/${path}`
}

// Auth hook for checking user authentication status
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      // Check for token in localStorage or cookies
      const token = typeof window !== 'undefined' 
        ? localStorage.getItem('auth_token') || document.cookie.includes('auth_token=') 
        : false
      
      if (token) {
        // Verify token with API (optional - for extra security)
        try {
          const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            setIsAuthenticated(true)
          } else {
            // Token invalid, clear it
            localStorage.removeItem('auth_token')
            setIsAuthenticated(false)
          }
        } catch (error) {
          // If API check fails, assume authenticated if token exists
          setIsAuthenticated(true)
        }
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    isAuthenticated,
    isLoading,
    checkAuth
  }
}

export default function HomePage() {
  const t = useTranslations()
  const tl = useTranslations('learn')
  const locale = useLocale() as 'ar' | 'en'
  const router = useRouter()
  const [showStickyCta, setShowStickyCta] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const [apiCourses, setApiCourses] = useState<any[]>([])
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const heroHeight = heroRef.current?.offsetHeight || 0
      setShowStickyCta(window.scrollY > heroHeight * 0.5)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Detect Dark/Light Mode for Wave Divider
  useEffect(() => {
    const checkTheme = () => {
      const isDark = 
        document.documentElement.classList.contains('dark') ||
        document.documentElement.getAttribute('data-theme') === 'dark' ||
        window.matchMedia('(prefers-color-scheme: dark)').matches
      
      setIsDarkMode(isDark)
    }
    
    checkTheme()
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class' || mutation.attributeName === 'data-theme') {
          checkTheme()
        }
      })
    })
    
    observer.observe(document.documentElement, { attributes: true })
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', checkTheme)
    
    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', checkTheme)
    }
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
    { icon: Briefcase, name: { ar: 'إدارة الأعمال', en: 'Business' }, count: 35, bg: 'rgba(27,35,64,0.12)', color: '#1B2340' },
  ]

  const maxEnrollments = Math.max(...apiCourses.map((c: any) => c._count?.enrollments || 0), 0)
  const featuredCourses = apiCourses.map((c: any, i: number) => ({
    id: c.id,
    title: typeof c.title === 'string' ? c.title : (locale === 'ar' ? c.titleAr || c.titleEn : c.titleEn || c.titleAr) || 'Course',
    duration: c.duration || 0,
    students: c._count?.enrollments || 0,
    rating: 4.7 + i * 0.1,
    price: c.price ?? 0,
    badge: (c._count?.enrollments || 0) === maxEnrollments && maxEnrollments > 0 ? (locale === 'ar' ? 'الأكثر طلباً' : 'Popular') : i === 1 ? (locale === 'ar' ? 'جديد' : 'New') : null,
    badgeBg: (c._count?.enrollments || 0) === maxEnrollments && maxEnrollments > 0 ? '#F5A623' : '#2BBFA3',
    thumbnail: c.thumbnail,
  }))

  // Handler for Start Free button
  const handleStartFreeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    
    if (authLoading) return // Don't do anything while loading
    
    if (isAuthenticated) {
      // User is logged in - redirect to dashboard
      window.location.href = `${MAIN_SITE_URL}/${locale}/dashboard`
    } else {
      // User is not logged in - redirect to login/register
      window.location.href = `${MAIN_SITE_URL}/${locale}/login`
    }
  }

  // Handler for Browse Courses button
  const handleBrowseCoursesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    router.push(`/${locale}/courses`)
  }

  return (
    <div className="min-h-screen">
      {/* ========== HERO - REVERSED LAYOUT ========== */}
      <section
        ref={heroRef}
        className="relative min-h-[92vh] text-white overflow-hidden"
        style={{ background: '#0D0D0D' }}
      >
        {/* Background ambient lights */}
        <div style={{
          position: 'absolute',
          top: '-20%',
          right: '5%',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(81,32,200,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-15%',
          left: '10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(43,191,163,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 1,
        }} />

        {/* Main Content Grid */}
        <div className="relative z-10 min-h-[92vh] flex items-center">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              
              {/* ========== LEFT SIDE - CONTENT ========== */}
              <div className="space-y-8 order-1">
                <div
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium"
                  style={{
                    background: 'rgba(81,32,200,0.15)',
                    border: '1px solid rgba(81,32,200,0.3)',
                    color: '#A78BFA',
                  }}
                >
                  <Sparkles className="h-4 w-4" style={{ color: '#F5A623' }} />
                  <span>{locale === 'ar' ? 'أكثر من 10,000 متعلم حققوا أهدافهم' : 'Over 10,000 learners achieved their goals'}</span>
                </div>

                <h1 
                  className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold font-madinet leading-tight"
                  style={{ 
                    color: '#ffffff !important',
                    textShadow: '0 2px 20px rgba(0,0,0,0.5), 0 0 40px rgba(255,255,255,0.1)'
                  }}
                >
                  {locale === 'ar' ? 'تعلم مهارة' : 'Learn a Skill'}
                  <span className="block mt-3" style={{ color: '#A78BFA' }}>
                    {locale === 'ar' ? tl('changeFuture') : 'Change Your Future'}
                  </span>
                </h1>

                <p className="text-lg sm:text-xl leading-relaxed max-w-xl" style={{ color: 'rgba(248,248,250,0.65)' }}>
                  {locale === 'ar'
                    ? 'منصة تعليمية متكاملة مع كورسات احترافية وكوتشينج شخصي لمساعدتك على تحقيق أهدافك المهنية'
                    : 'A comprehensive learning platform with professional courses and personal coaching to help you achieve your career goals'}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  {/* ===== START FREE NOW BUTTON ===== */}
                  <a
                    href="#"
                    onClick={handleStartFreeClick}
                    className={`btn-cta-primary text-base inline-flex items-center justify-center gap-2 group ${authLoading ? 'opacity-75 pointer-events-none' : ''}`}
                    aria-disabled={authLoading}
                    role="button"
                    tabIndex={authLoading ? -1 : 0}
                  >
                    {authLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                      </>
                    ) : (
                      <>
                        {locale === 'ar' ? 'ابدأ مجاناً الآن' : 'Start Free Now'}
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" style={{ transform: locale === 'ar' ? 'scaleX(-1)' : 'none' }} />
                      </>
                    )}
                  </a>
                  
                  {/* ===== BROWSE COURSES BUTTON ===== */}
                  <a
                    href="#"
                    onClick={handleBrowseCoursesClick}
                    className="inline-flex items-center justify-center gap-2 text-base font-semibold rounded-xl px-8 py-3.5 transition-all duration-200 hover:bg-white/10 active:scale-95"
                    style={{
                      background: 'transparent',
                      border: '1.5px solid rgba(255,255,255,0.6)',
                      color: '#ffffff !important',
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      textDecoration: 'none',
                      textShadow: '0 2px 15px rgba(0,0,0,0.4)',
                      cursor: 'pointer',
                    }}
                  >
                    {locale === 'ar' ? 'تصفح الكورسات' : 'Browse Courses'}
                  </a>
                </div>
              </div>

              {/* ========== RIGHT SIDE - IMAGE ========== */}
              <div className="flex justify-center lg:justify-end order-2">
                <div 
                  className="absolute rounded-3xl blur-3xl opacity-30"
                  style={{
                    width: '450px',
                    height: '450px',
                    background: 'linear-gradient(135deg, rgba(81,32,200,0.4) 0%, rgba(43,191,163,0.3) 100%)',
                    top: '50%',
                    right: '8%',
                    transform: 'translateY(-50%)',
                  }}
                />
                
                <div className="relative animate-float">
                  <img
                    src="/Remove_the_background_from_this_laptop_image_showi-1776361981480.png"
                    alt="Learning Platform"
                    className="relative w-full max-w-lg lg:max-w-xl object-contain drop-shadow-2xl"
                    style={{ filter: 'drop-shadow(0 25px 50px rgba(81,32,200,0.25))' }}
                  />
                  
                  <div className="absolute -top-4 -left-4 w-20 h-20 rounded-full opacity-60" style={{ background: 'linear-gradient(135deg, #5120C8 0%, #A78BFA 100%)', filter: 'blur(1px)' }} />
                  <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-lg opacity-40 rotate-12" style={{ background: 'linear-gradient(135deg, #2BBFA3 0%, #5EEAD4 100%)', filter: 'blur(1px)' }} />
                  
                  <div className="absolute top-1/4 -left-10 sm:-left-14 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border animate-float-badge-reverse" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)', borderColor: 'rgba(255,255,255,0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #F5A623 0%, #FCD34D 100%)', boxShadow: '0 4px 12px rgba(245,166,35,0.4)' }}>
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-bold whitespace-nowrap tracking-wide">Interactive</span>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-1/3 -right-8 sm:-right-12 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md border animate-float-badge" style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.2) 0%, rgba(81,32,200,0.1) 100%)', borderColor: 'rgba(167,139,250,0.3)', boxShadow: '0 8px 32px rgba(81,32,200,0.25), inset 0 1px 0 rgba(255,255,255,0.1)' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #818CF8 100%)', boxShadow: '0 4px 12px rgba(167,139,250,0.4)' }}>
                        <Award className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-bold whitespace-nowrap tracking-wide">Certified</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ========== ADAPTIVE WAVE DIVIDER ========== */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none z-10">
          <svg 
            className="relative block w-full h-[120px] sm:h-[150px] lg:h-[180px]" 
            viewBox="0 0 1440 180" 
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="waveGradientDark" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0D0D0D" />
                <stop offset="50%" stopColor="#1a1a2e" />
                <stop offset="100%" stopColor="#0a0a0a" />
              </linearGradient>
              <linearGradient id="waveGradientLight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#f8f9fa" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
              <filter id="glowDark">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <path d="M0,90 C240,140 480,40 720,80 C960,120 1200,60 1440,100 L1440,180 L0,180 Z" className="wave-main-path" filter="url(#glowDark)" opacity="0.98" />
            <path d="M0,110 C180,150 360,70 540,100 C720,130 900,80 1080,110 C1260,140 1380,100 1440,120 L1440,180 L0,180 Z" className="wave-secondary-path" opacity="0.5" />
            <path d="M0,130 C200,160 400,120 600,145 C800,170 1000,130 1200,155 C1350,170 1420,150 1440,160 L1440,180 L0,180 Z" className="wave-accent-path" opacity="0.12" />
          </svg>
        </div>
      </section>

      {/* ========== CAREER PATHS ========== */}
      <CareerPathsSection />

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
            <Button variant="outline" asChild className="shrink-0">
              <Link href={`/${locale}/courses`}>
                {locale === 'ar' ? 'عرض الكل' : 'View All'}
                <ArrowRight className="h-4 w-4" style={{ transform: locale === 'ar' ? 'scaleX(-1)' : 'none' }} />
              </Link>
            </Button>
          </div>

          {featuredCourses.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--muted)' }}>
              {locale === 'ar' ? tl('loadingCourses') : 'Loading courses...'}
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile 
              ? 'repeat(2, 1fr)'
              : 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: isMobile ? 12 : 20,
          }}>
            {featuredCourses.map((course, index) => (
              <div key={course.id} className="group relative rounded-xl overflow-hidden card-hover" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="relative aspect-video overflow-hidden" style={{ background: 'var(--navy)' }}>
                  {thumbUrl(course.thumbnail) ? (
                    <img src={thumbUrl(course.thumbnail)!} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Laptop className="h-10 w-10 text-primary" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.9)' }}>
                      <Play className="h-6 w-6" style={{ color: 'var(--navy)', transform: 'translateX(2px)' }} />
                    </div>
                  </div>
                  {course.badge && (<div className="absolute top-3 right-3 rtl:right-auto rtl:left-3 px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: course.badgeBg }}>{course.badge}</div>)}
                  <div className="absolute bottom-3 right-3 rtl:right-auto rtl:left-3 px-2 py-1 rounded text-xs text-white flex items-center gap-1" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}><Clock className="h-3 w-3" />{course.duration}h</div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-3 line-clamp-2 transition-colors" style={{ color: 'var(--foreground)' }}>{typeof course.title === 'string' ? course.title : ''}</h3>
                  <div className="flex items-center gap-4 text-sm mb-4" style={{ color: 'var(--muted)' }}>
                    <div className="flex items-center gap-1"><Users className="h-4 w-4" /><span>{course.students.toLocaleString()}</span></div>
                    <div className="flex items-center gap-1"><Star className="h-4 w-4" style={{ color: '#F5A623', fill: '#F5A623' }} /><span className="font-medium">{course.rating}</span></div>
                  </div>
                  <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="text-xl font-bold" style={{ color: 'var(--primary)' }}>{course.price}<span className="text-sm font-normal ml-1" style={{ color: 'var(--muted)' }}>{locale === 'ar' ? 'ر.س' : 'SAR'}</span></div>
                    <Link href={`/${locale}/courses/${course.id}`} className="btn-primary" style={{ fontSize: 13, padding: '8px 16px' }}>{locale === 'ar' ? 'التحقق الآن' : 'Enroll'}</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16">
            <h3 className="text-xl font-bold text-center mb-6 font-madinet" style={{ color: 'var(--foreground)' }}>{locale === 'ar' ? 'تصفح حسب المجال' : 'Browse by Category'}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category, index) => (
                <Link key={index} href={`/${locale}/courses?category=${index}`} className="group flex items-center gap-4 p-4 rounded-xl card-hover" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div className="shrink-0 h-12 w-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: category.bg }}><category.icon className="h-6 w-6" style={{ color: category.color }} /></div>
                  <div><h4 className="font-semibold" style={{ color: 'var(--foreground)' }}>{category.name[locale]}</h4><p className="text-sm" style={{ color: 'var(--muted)' }}>{category.count} {locale === 'ar' ? 'كورس' : 'Courses'}</p></div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="relative py-24 text-white overflow-hidden" style={{ background: 'var(--navy)' }}>
        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm mb-6" style={{ background: 'rgba(248,248,250,0.07)', border: '1px solid rgba(248,248,250,0.12)', color: 'rgba(248,248,250,0.8)' }}><Globe className="h-4 w-4" /><span>{locale === 'ar' ? 'شهادات معتمدة عالمياً' : 'Globally Certified'}</span></div>
          <h2 className="text-3xl sm:text-4xl font-bold font-madinet">{locale === 'ar' ? 'جاهز تبدأ رحلتك؟' : 'Ready to Start?'}</h2>
          <p className="mt-4 text-lg" style={{ color: 'rgba(248,248,250,0.65)' }}>{locale === 'ar' ? tl('joinLearners') : 'Join thousands of learners and start today'}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            {/* ===== CTA START FREE BUTTON ===== */}
            <a
              href="#"
              onClick={handleStartFreeClick}
              className={`btn-cta-primary text-base inline-flex items-center justify-center gap-2 ${authLoading ? 'opacity-75 pointer-events-none' : ''}`}
              aria-disabled={authLoading}
              role="button"
              tabIndex={authLoading ? -1 : 0}
            >
              {authLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                </>
              ) : (
                <>
                  {locale === 'ar' ? 'ابدأ مجاناً الآن' : 'Start Free Now'}
                  <ArrowRight className="h-5 w-5" style={{ transform: locale === 'ar' ? 'scaleX(-1)' : 'none' }} />
                </>
              )}
            </a>
            
            {/* ===== CTA BROWSE COURSES BUTTON ===== */}
            <a
              href="#"
              onClick={handleBrowseCoursesClick}
              className="inline-flex items-center gap-2 text-base font-semibold rounded-xl px-8 py-3.5 transition-all duration-200 hover:bg-white/10 active:scale-95"
              style={{
                background: 'transparent',
                border: '1.5px solid rgba(248,248,250,0.25)',
                color: '#F8F8FA',
                textDecoration: 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                cursor: 'pointer',
              }}
            >
              {locale === 'ar' ? 'تصفح الكورسات' : 'Browse Courses'}
            </a>
          </div>
        </div>
      </section>

      {/* ========== STICKY CTA ========== */}
      <div className={`floating-cta ${showStickyCta ? 'visible' : ''}`}>
        <a
          href="#"
          onClick={handleStartFreeClick}
          className={`btn-primary w-full justify-center ${authLoading ? 'opacity-75 pointer-events-none' : ''}`}
          aria-disabled={authLoading}
          role="button"
          tabIndex={authLoading ? -1 : 0}
        >
          {authLoading ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
            </>
          ) : (
            <>
              {locale === 'ar' ? 'ابدأ التعلم الآن' : 'Start Learning Now'}
              <ArrowRight className="h-4 w-4" style={{ transform: locale === 'ar' ? 'scaleX(-1)' : 'none' }} />
            </>
          )}
        </a>
      </div>

      {/* ========== ANIMATIONS ========== */}
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-20px); } }
        @keyframes floatBadge { 0%, 100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-12px) rotate(2deg); } }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-badge { animation: floatBadge 7s ease-in-out infinite; }
        .animate-float-badge-reverse { animation: floatBadge 5s ease-in-out infinite reverse; }
      `}</style>
    </div>
  )
}