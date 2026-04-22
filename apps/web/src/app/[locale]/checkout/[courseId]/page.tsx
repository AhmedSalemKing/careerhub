'use client'
import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { get, post } from '../../../../lib/api'
import { getMediaUrl } from '../../../../lib/media'
import { notify } from '../../../../lib/notify'
import { learnUrl } from '../../../../lib/constants'
import {
  Shield, CheckCircle,
  Lock, ArrowRight, ArrowLeft, Users, BookOpen, Clock, Zap,
  CreditCard, Gift, Award, ChevronDown, CheckCheck, Sparkles,
  Smartphone, Headphones, RefreshCw, Truck, Star, BadgeCheck
} from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements, PaymentElement,
  useStripe, useElements,
} from '@stripe/react-stripe-js'

const stripePromise =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes('your-stripe')
    ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
    : null

// ── Theme Detection ────────────────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  
  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (saved) setTheme(saved)
    else if (systemDark) setTheme('dark')
    
    const interval = setInterval(() => {
      const t = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (t) setTheme(t)
    }, 500)
    return () => clearInterval(interval)
  }, [])
  
  return theme
}

// ── Color System ──────────────────────────────────────────────────────────
function useColors() {
  const isDark = useTheme() === 'dark'
  
  return {
    isDark,
    bg: isDark ? 'rgb(0 0 0)' : '#f8fafc',
    surface: isDark ? 'rgb(25 27 32)' : '#ffffff',
    surface2: isDark ? 'rgb(20 22 28)' : '#f1f5f9',
    cardBg: isDark ? 'rgb(25 27 32)' : '#ffffff',
    headerBg: isDark ? '#0d0d0d' : '#ffffff',
    textPrimary: isDark ? '#ffffff' : '#0d0d0d',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    borderColor: isDark ? '#1e293b' : '#e2e8f0',
    muted: isDark ? '#64748b' : '#94a3b8',
    primary: '#6c3ce0',
    primaryLight: 'rgba(108, 60, 224, 0.1)',
    teal: '#0d9488',
    green: '#16a34a',
    red: '#ef4444',
    blue: '#3b82f6',
    gold: '#f59e0b',
    gradient: 'linear-gradient(135deg, #5120c8, #6c3ce0)',
    gradientTeal: 'linear-gradient(135deg, #0d9488, #14b8a6)',
    shadow: isDark 
      ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' 
      : '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
    shadowSm: isDark 
      ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
      : '0 4px 20px rgba(0, 0, 0, 0.08)',
  }
}

// ── Stripe Card Sub-component ──────────────────────────────────────────────
function StripeForm({
  courseId,
  amount,
  onSuccess,
}: {
  courseId: string
  amount: number
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const c = useColors()

  const handlePay = async () => {
    if (!stripe || !elements) return
    setProcessing(true)
    setError('')

    const { error: submitErr } = await elements.submit()
    if (submitErr) {
      setError(submitErr.message || 'خطأ')
      setProcessing(false)
      return
    }

    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (result.error) {
      setError(result.error.message || 'فشل الدفع')
      setProcessing(false)
      return
    }

    if (result.paymentIntent?.status === 'succeeded') {
      try {
        await post('/payment/confirm', {
          paymentIntentId: result.paymentIntent.id,
          courseId,
        })
        onSuccess()
      } catch (e: any) {
        setError(e?.response?.data?.message || 'حدث خطأ في التأكيد')
      }
    }
    setProcessing(false)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-1" style={{ background: c.surface2 }}>
        <PaymentElement
          options={{
            layout: 'tabs',
            wallets: { applePay: 'never', googlePay: 'never' },
          }}
        />
      </div>
      
      {error && (
        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ 
          background: `${c.red}10`, 
          border: `1px solid ${c.red}30` 
        }}>
          <div className="mt-0.5">
            <Shield className="h-5 w-5" style={{ color: c.red }} />
          </div>
          <p className="text-sm flex-1" style={{ color: c.red }}>{error}</p>
        </div>
      )}
      
      <button
        onClick={handlePay}
        disabled={!stripe || processing}
        className="w-full rounded-2xl py-4.5 font-bold text-white text-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-3"
        style={{ 
          background: c.gradient, 
          boxShadow: `0 8px 32px ${c.primary}40`,
        }}
      >
        {processing ? (
          <>
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-white border-t-transparent" />
            جاري المعالجة...
          </>
        ) : (
          <>
            <Lock className="h-6 w-6" />
            ادفع {amount} ريال الآن
          </>
        )}
      </button>
      
      <div className="flex items-center justify-center gap-4 pt-2">
        <div className="flex items-center gap-1.5" style={{ color: c.muted }}>
          <Shield className="h-4 w-4" style={{ color: c.green }} />
          <span className="text-xs">دفع آمن مشفر</span>
        </div>
        <div className="h-4 w-px" style={{ background: c.borderColor }} />
        <span className="text-xs" style={{ color: c.muted }}>SSL 256-bit</span>
      </div>
    </div>
  )
}

// ── Main Checkout Page ─────────────────────────────────────────────────────
export default function CheckoutPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const locale = useLocale()
  const router = useRouter()
  const c = useColors()

  const [clientSecret, setClientSecret] = useState('')
  const [success, setSuccess] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [creatingIntent, setCreatingIntent] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('deveway_token')
    if (!token) {
      router.push(`/${locale}/login?redirect=/${locale}/checkout/${courseId}`)
    }
  }, [courseId, locale, router])

  const { data, isLoading } = useQuery({
    queryKey: ['checkout', courseId],
    queryFn: async () => {
      const res = await get(`/payment/checkout/${courseId}`)
      return res?.data?.data
    },
    enabled: !!courseId,
    retry: false,
  })

  const handleStartPayment = useCallback(async () => {
    if (!agreed) {
      notify.error('يرجى الموافقة على الشروط أولاً')
      return
    }
    setCreatingIntent(true)
    try {
      const res = await post('/payment/create-intent', { courseId })
      const d = res?.data?.data

      if (d?.free || d?.sandbox) {
        notify.success('تم الاشتراك بنجاح!')
        setSuccess(true)
        return
      }
      if (d?.clientSecret) {
        setClientSecret(d.clientSecret)
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.message || 'حدث خطأ')
    } finally {
      setCreatingIntent(false)
    }
  }, [courseId, agreed])

  const course = data?.course
  const alreadyEnrolled = data?.alreadyEnrolled
  const thumb = getMediaUrl(course?.thumbnail)
  const courseTitle = course?.titleAr || course?.titleEn || ''

  if (isLoading) return <Skeleton />

  if (alreadyEnrolled) return (
    <div className="min-h-screen flex items-center justify-center p-6" dir="rtl" style={{ background: `linear-gradient(180deg, ${c.bg} 0%, ${c.headerBg} 100%)` }}>
      <div className="max-w-lg w-full">
        <div className="rounded-3xl p-10 text-center relative overflow-hidden" style={{ 
          background: c.surface, 
          boxShadow: c.shadow,
          border: `1px solid ${c.green}30`
        }}>
          {/* Success glow effect */}
          <div className="absolute inset-0 opacity-30" style={{
            background: `radial-gradient(circle at center, ${c.green}20 0%, transparent 70%)`
          }} />
          
          <div className="relative">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full animate-pulse" style={{ 
              background: `${c.green}15`,
              boxShadow: `0 0 40px ${c.green}30`
            }}>
              <BadgeCheck className="h-12 w-12" style={{ color: c.green }} />
            </div>
            
            <h2 className="text-3xl font-bold mb-3" style={{ color: c.textPrimary }}>
              أنت مشترك بالفعل! ✨
            </h2>
            <p className="text-base mb-8" style={{ color: c.textSecondary }}>
              يمكنك الوصول لهذا الكورس مباشرة والبدء في التعلم
            </p>
            
            <a
              href={learnUrl(`/${locale}/courses/${courseId}`)}
              className="inline-flex items-center gap-3 rounded-2xl px-10 py-4 font-bold text-white text-lg transition-all hover:scale-[1.03] hover:shadow-xl"
              style={{ 
                background: c.gradientTeal, 
                boxShadow: `0 8px 32px rgba(13, 148, 136, 0.35)`
              }}
            >
              ابدأ التعلم الآن
              <ArrowLeft className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )

  if (success) return (
    <div className="min-h-screen flex items-center justify-center p-6" dir="rtl" style={{ background: `linear-gradient(180deg, ${c.bg} 0%, ${c.headerBg} 100%)` }}>
      <div className="max-w-lg w-full">
        <div className="rounded-3xl p-10 text-center relative overflow-hidden" style={{ 
          background: c.surface, 
          boxShadow: c.shadow,
          border: `1px solid ${c.green}30`
        }}>
          {/* Animated success elements */}
          <div className="absolute top-0 left-0 right-0 h-2" style={{ background: c.gradientTeal }} />
          <div className="absolute inset-0 opacity-20" style={{
            background: `radial-gradient(circle at 50% 0%, ${c.green}30 0%, transparent 60%)`
          }} />
          
          <div className="relative">
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full relative" style={{ 
              background: `conic-gradient(from 0deg, ${c.green}, ${c.teal}, ${c.green})`,
              animation: 'spin 3s linear infinite'
            }}>
              <div className="absolute inset-1 rounded-full" style={{ background: c.surface }} />
              <CheckCircle className="h-12 w-12 absolute" style={{ color: c.green }} />
            </div>
            
            <h2 className="text-4xl font-bold mb-2" style={{ color: c.textPrimary }}>
              تم الاشتراك بنجاح! 🎉
            </h2>
            <p className="text-base mb-1" style={{ color: c.textSecondary }}>اشتركت في كورس</p>
            <p className="text-xl font-bold mb-8" style={{ color: c.primary }}>{courseTitle}</p>

            {/* Receipt Card */}
            <div className="rounded-2xl p-6 mb-8 space-y-4 text-right" style={{ 
              background: c.surface2, 
              border: `1px solid ${c.borderColor}` 
            }}>
              <div className="flex justify-between items-center pb-4" style={{ borderBottom: `1px solid ${c.borderColor}` }}>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5" style={{ color: c.green }} />
                  <span className="font-semibold" style={{ color: c.green }}>مدفوع بنجاح</span>
                </div>
                <span className="text-sm" style={{ color: c.muted }}>الحالة</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg" style={{ color: c.primary }}>{course?.price} ريال</span>
                <span className="text-sm" style={{ color: c.muted }}>المبلغ</span>
              </div>
              
              <div className="flex justify-between items-center pt-4" style={{ borderTop: `1px solid ${c.borderColor}` }}>
                <span className="text-sm" style={{ color: c.textSecondary }}>
                  {new Date().toLocaleDateString('ar-SA', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <span className="text-sm" style={{ color: c.muted }}>التاريخ</span>
              </div>
            </div>

            <div className="space-y-3">
              <a
                href={learnUrl(`/${locale}/courses/${courseId}`)}
                className="flex w-full items-center justify-center gap-3 rounded-2xl py-4.5 font-bold text-white text-lg transition-all hover:scale-[1.02]"
                style={{ 
                  background: c.gradient, 
                  boxShadow: `0 8px 32px ${c.primary}40`
                }}
              >
                <Sparkles className="h-6 w-6" />
                ابدأ التعلم الآن
                <ArrowLeft className="h-5 w-5" />
              </a>
              
              <button
                onClick={() => router.push(`/${locale}/dashboard`)}
                className="w-full rounded-2xl py-4 text-sm font-medium transition-all hover:bg-opacity-80"
                style={{ 
                  background: c.surface2, 
                  color: c.textSecondary,
                  border: `1px solid ${c.borderColor}`
                }}
              >
                العودة للداشبورد
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen py-8 px-4" dir="rtl" style={{ background: `linear-gradient(180deg, ${c.bg} 0%, ${c.headerBg} 50%, ${c.bg} 100%)` }}>
      <div className="mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4" style={{ 
            background: c.primaryLight, 
            color: c.primary 
          }}>
            <Lock className="h-4 w-4" />
            دفع آمن ومشفر
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ color: c.textPrimary }}>
            إتمام الاشتراك
          </h1>
          <p className="text-lg" style={{ color: c.textSecondary }}>
            أنت على بعد خطوة واحدة من بدء رحلتك التعليمية
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">

          {/* ── Course Info (3 cols) ── */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Course Card */}
            <div className="rounded-3xl overflow-hidden" style={{ 
              background: c.surface, 
              boxShadow: c.shadow,
              border: `1px solid ${c.borderColor}`
            }}>
              {/* Thumbnail */}
              <div className="aspect-video relative overflow-hidden" style={{ background: c.surface2 }}>
                {thumb ? (
                  <>
                    <img src={thumb} alt={courseTitle} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 right-4 left-4">
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 rounded-xl text-sm font-bold text-white" style={{ 
                          background: 'rgba(0,0,0,0.5)',
                          backdropFilter: 'blur(10px)'
                        }}>
                          كورس تعليمي
                        </div>
                        {course?.level && (
                          <div className="px-3 py-1.5 rounded-xl text-sm font-medium" style={{ 
                            background: `${c.primary}cc`,
                            color: 'white'
                          }}>
                            {course.level === 'BEGINNER' ? 'مبتدئ' : course.level === 'INTERMEDIATE' ? 'متوسط' : 'متقدم'}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-20 w-20" style={{ color: `${c.primary}30` }} />
                  </div>
                )}
              </div>
              
              {/* Course Details */}
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-3" style={{ color: c.textPrimary }}>
                  {courseTitle}
                </h2>
                
                {(course?.descriptionAr || course?.descriptionEn) && (
                  <p className="text-base leading-relaxed mb-5 line-clamp-3" style={{ color: c.textSecondary }}>
                    {course.descriptionAr || course.descriptionEn}
                  </p>
                )}
                
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Users, value: course?._count?.enrollments || 0, label: 'طالب' },
                    { icon: BookOpen, value: course?._count?.sections || 0, label: 'قسم' },
                    { icon: Clock, value: course?.duration || '-', label: 'ساعة' },
                  ].map(({ icon: Icon, value, label }, i) => (
                    <div key={i} className="rounded-xl p-3 text-center" style={{ 
                      background: c.surface2,
                      border: `1px solid ${c.borderColor}`
                    }}>
                      <Icon className="h-5 w-5 mx-auto mb-1.5" style={{ color: c.primary }} />
                      <div className="font-bold text-lg" style={{ color: c.textPrimary }}>{value}</div>
                      <div className="text-xs" style={{ color: c.muted }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Price Summary - Enhanced */}
            <div className="rounded-3xl p-6" style={{ 
              background: c.surface, 
              boxShadow: c.shadowSm,
              border: `1px solid ${c.borderColor}`
            }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: c.primaryLight }}>
                  <CreditCard className="h-5 w-5" style={{ color: c.primary }} />
                </div>
                <h3 className="text-xl font-bold" style={{ color: c.textPrimary }}>ملخص الطلب</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3" style={{ borderBottom: `1px dashed ${c.borderColor}` }}>
                  <div className="flex items-center gap-2" style={{ color: c.textSecondary }}>
                    <BookOpen className="h-4 w-4" />
                    <span>سعر الكورس</span>
                  </div>
                  <span className="font-semibold text-lg">{course?.price} ريال</span>
                </div>
                
                <div className="flex justify-between items-center py-3" style={{ borderBottom: `1px dashed ${c.borderColor}` }}>
                  <div className="flex items-center gap-2" style={{ color: c.textSecondary }}>
                    <RefreshCw className="h-4 w-4" />
                    <span>الضريبة</span>
                  </div>
                  <span className="px-3 py-1 rounded-lg text-sm font-medium" style={{ 
                    background: `${c.green}15`, 
                    color: c.green 
                  }}>مجاني</span>
                </div>
                
                <div className="flex justify-between items-center py-4 mt-2 rounded-xl px-4" style={{ 
                  background: c.primaryLight,
                  border: `1px solid ${c.primary}30`
                }}>
                  <span className="font-bold text-lg">الإجمالي</span>
                  <span className="font-bold text-2xl" style={{ color: c.primary }}>{course?.price} ريال</span>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield, title: 'حماية مشفرة', desc: 'SSL 256-bit', color: c.green },
                { icon: Zap, title: 'وصول فوري', desc: 'بعد الدفع مباشرة', color: c.gold },
                { icon: RefreshCw, title: 'ضمان استرداد', desc: 'خلال 7 أيام', color: c.blue },
                { icon: Headphones, title: 'دعم متواصل', desc: 'على مدار الساعة', color: c.teal },
              ].map(({ icon: Icon, title, desc, color }, i) => (
                <div key={i} className="rounded-2xl p-4 flex items-start gap-3 transition-transform hover:scale-[1.02]" style={{ 
                  background: c.surface, 
                  border: `1px solid ${c.borderColor}`,
                  boxShadow: c.shadowSm
                }}>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <div>
                    <div className="font-semibold text-sm mb-0.5" style={{ color: c.textPrimary }}>{title}</div>
                    <div className="text-xs" style={{ color: c.muted }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="rounded-2xl p-5 flex items-center justify-around flex-wrap gap-4" style={{ 
              background: c.surface2,
              border: `1px solid ${c.borderColor}`
            }}>
              {[
                { icon: Shield, label: 'آمن 100%', color: c.green },
                { icon: Lock, label: 'بيانات محمية', color: c.blue },
                { icon: CreditCard, label: 'دفع متعدد', color: c.primary },
                { icon: Award, label: 'شهادة معتمدة', color: c.gold },
              ].map(({ icon: Icon, label, color }, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Icon className="h-5 w-5" style={{ color }} />
                  <span className="text-sm font-medium" style={{ color: c.textSecondary }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Payment Section (2 cols) ── */}
          <div className="lg:col-span-2">
            <div className="sticky top-8 space-y-5">
              
              {!clientSecret ? (
                <>
                  {/* Payment Method Card */}
                  <div className="rounded-3xl p-6" style={{ 
                    background: c.surface, 
                    boxShadow: c.shadow,
                    border: `1px solid ${c.borderColor}`
                  }}>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ 
                        background: c.gradient 
                      }}>
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold" style={{ color: c.textPrimary }}>وسيلة الدفع</h3>
                        <p className="text-xs" style={{ color: c.muted }}>اختر طريقة الدفع المناسبة</p>
                      </div>
                    </div>

                    {!stripePromise ? (
                      <div className="rounded-2xl p-5 text-center space-y-3" style={{ 
                        background: `${c.gold}10`, 
                        border: `1px dashed ${c.gold}40` 
                      }}>
                        <Sparkles className="h-8 w-8 mx-auto" style={{ color: c.gold }} />
                        <p className="font-semibold" style={{ color: c.gold }}>وضع تجريبي</p>
                        <p className="text-sm" style={{ color: c.muted }}>لن يتم خصم أي مبلغ حقيقي</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-2xl p-4 flex items-center gap-4 cursor-pointer transition-all hover:scale-[1.01]" style={{ 
                          background: c.primaryLight,
                          border: `2px solid ${c.primary}`
                        }}>
                          <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: c.primary }}>
                            <CreditCard className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold" style={{ color: c.primary }}>بطاقة ائتمان / خصم</div>
                            <div className="text-xs" style={{ color: c.muted }}>Visa, Mastercard, Mada</div>
                          </div>
                          <CheckCircle className="h-6 w-6" style={{ color: c.primary }} />
                        </div>
                        
                        <div className="flex items-center justify-center gap-3 pt-2">
                          <div className="h-8 w-12 rounded bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">VISA</span>
                          </div>
                          <div className="h-8 w-12 rounded bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">MC</span>
                          </div>
                          <div className="h-8 w-12 rounded flex items-center justify-center" style={{ background: '#1e40af' }}>
                            <span className="text-white text-xs font-bold">mada</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Terms Checkbox */}
                  <label className="flex items-start gap-4 cursor-pointer rounded-2xl p-5 transition-all hover:scale-[1.01]" style={{ 
                    background: c.surface, 
                    border: `2px solid ${agreed ? c.primary : c.borderColor}`,
                    boxShadow: agreed ? `0 0 20px ${c.primary}20` : c.shadowSm
                  }}>
                    <div
                      onClick={() => setAgreed(!agreed)}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                        agreed
                          ? 'border-transparent'
                          : ''
                      }`}
                      style={{
                        background: agreed ? c.gradient : 'transparent',
                        borderColor: agreed ? undefined : c.borderColor,
                      }}
                    >
                      {agreed && <CheckCheck className="h-4 w-4 text-white" />}
                    </div>
                    <span className="text-sm leading-relaxed" style={{ color: c.textSecondary }}>
                      أوافق على{' '}
                      <span className="font-semibold cursor-pointer hover:underline" style={{ color: c.primary }}>
                        شروط الاستخدام
                      </span>{' '}
                      و{' '}
                      <span className="font-semibold cursor-pointer hover:underline" style={{ color: c.primary }}>
                        سياسة الخصوصية
                      </span>
                      {' '}و{' '}
                      <span className="font-semibold cursor-pointer hover:underline" style={{ color: c.primary }}>
                        سياسة الاسترداد
                      </span>
                    </span>
                  </label>

                  {/* Pay Button */}
                  <button
                    onClick={handleStartPayment}
                    disabled={!agreed || creatingIntent}
                    className={`w-full rounded-2xl py-5 font-bold text-white text-xl transition-all ${
                      agreed && !creatingIntent
                        ? 'hover:scale-[1.02] active:scale-[0.98]'
                        : 'cursor-not-allowed opacity-50'
                    } flex items-center justify-center gap-3`}
                    style={{ 
                      background: agreed && !creatingIntent ? c.gradient : '#374151',
                      boxShadow: agreed && !creatingIntent ? `0 10px 40px ${c.primary}40` : 'none',
                    }}
                  >
                    {creatingIntent ? (
                      <>
                        <div className="h-6 w-6 animate-spin rounded-full border-3 border-white border-t-transparent" />
                        جاري التحضير...
                      </>
                    ) : (
                      <>
                        {course?.price === 0 ? (
                          <>
                            <Gift className="h-6 w-6" />
                            اشترك مجاناً
                          </>
                        ) : (
                          <>
                            <Lock className="h-6 w-6" />
                            ادفع {course?.price} ريال
                          </>
                        )}
                      </>
                    )}
                  </button>

                  {/* Guarantee Text */}
                  <div className="text-center space-y-2 pt-2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm" style={{ 
                      background: `${c.green}10`,
                      color: c.green
                    }}>
                      <Shield className="h-4 w-4" />
                      ضمان استرداد خلال 7 أيام
                    </div>
                    <p className="text-xs" style={{ color: c.muted }}>
                      إذا لم تكن راضياً عن المحتوى، نعيد لك المبلغ بالكامل
                    </p>
                  </div>
                </>
              ) : (
                stripePromise && (
                  <div className="rounded-3xl p-6" style={{ 
                    background: c.surface, 
                    boxShadow: c.shadow,
                    border: `1px solid ${c.borderColor}`
                  }}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ 
                        background: c.gradient 
                      }}>
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold" style={{ color: c.textPrimary }}>بيانات البطاقة</h3>
                        <p className="text-xs" style={{ color: c.muted }}>معلوماتك آمنة ومشفرة 100%</p>
                      </div>
                    </div>
                    
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: 'night',
                          variables: {
                            colorPrimary: c.primary,
                            colorBackground: c.surface2,
                            colorText: c.textPrimary,
                            colorDanger: c.red,
                            borderRadius: '16px',
                            fontFamily: 'system-ui, sans-serif',
                            spacingUnit: '8px',
                          },
                          rules: {
                            '.Label': {
                              color: c.textSecondary,
                              fontWeight: '600',
                            },
                          },
                        },
                      }}
                    >
                      <StripeForm
                        courseId={courseId}
                        amount={course?.price || 0}
                        onSuccess={() => {
                          notify.success('تم الاشتراك بنجاح!')
                          setSuccess(true)
                        }}
                      />
                    </Elements>
                  </div>
                )
              )}

              {/* Test Cards Info */}
              {!clientSecret && (
                <div className="rounded-2xl p-4 text-center space-y-2" style={{ 
                  background: c.surface2,
                  border: `1px dashed ${c.borderColor}`
                }}>
                  <p className="text-xs font-medium" style={{ color: c.muted }}>بطاقة اختبار:</p>
                  <code className="text-sm font-mono px-3 py-1.5 rounded-lg" style={{ 
                    background: c.surface,
                    color: c.primary,
                    border: `1px solid ${c.borderColor}`
                  }}>
                    4242 4242 4242 4242
                  </code>
                  <span className="text-xs" style={{ color: c.muted }}>·</span>
                  <code className="text-sm font-mono px-3 py-1.5 rounded-lg" style={{ 
                    background: c.surface,
                    color: c.primary,
                    border: `1px solid ${c.borderColor}`
                  }}>
                    12/29
                  </code>
                  <span className="text-xs" style={{ color: c.muted }}>·</span>
                  <code className="text-sm font-mono px-3 py-1.5 rounded-lg" style={{ 
                    background: c.surface,
                    color: c.primary,
                    border: `1px solid ${c.borderColor}`
                  }}>
                    123
                  </code>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ 
        background: c.primary,
        transform: 'translate(-50%, -50%)'
      }} />
      <div className="fixed bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ 
        background: c.teal,
        transform: 'translate(50%, 50%)'
      }} />
    </div>
  )
}

// ── Skeleton Loader ────────────────────────────────────────────────────────
function Skeleton() {
  const c = useColors()
  
  return (
    <div className="min-h-screen py-8 px-4" style={{ background: c.bg }}>
      <div className="mx-auto max-w-6xl">
        {/* Header skeleton */}
        <div className="text-center mb-10 space-y-4">
          <div className="h-8 w-40 mx-auto animate-pulse rounded-xl" style={{ background: c.surface2 }} />
          <div className="h-12 w-64 mx-auto animate-pulse rounded-xl" style={{ background: c.surface2 }} />
          <div className="h-6 w-96 mx-auto animate-pulse rounded-xl" style={{ background: c.surface2 }} />
        </div>
        
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            <div className="h-[400px] animate-pulse rounded-3xl" style={{ background: c.surface }} />
            <div className="h-48 animate-pulse rounded-3xl" style={{ background: c.surface }} />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl" style={{ background: c.surface }} />
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 space-y-5">
            <div className="h-64 animate-pulse rounded-3xl" style={{ background: c.surface }} />
            <div className="h-32 animate-pulse rounded-2xl" style={{ background: c.surface }} />
            <div className="h-20 animate-pulse rounded-2xl" style={{ background: c.surface }} />
          </div>
        </div>
      </div>
    </div>
  )
}