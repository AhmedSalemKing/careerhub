"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useLocale } from "next-intl"
import { get, post } from "../../../../lib/api"
import { getMediaUrl } from "../../../../lib/media"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, Loader2, AlertTriangle, ArrowRight, Video, Radio, MapPin, BookOpen } from "lucide-react"

export default function CheckoutPage() {
  const params = useParams()
  const courseId = params.courseId as string
  const locale = useLocale()
  const isAr = locale === "ar"
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("deveway_token") || sessionStorage.getItem("deveway_token")
    if (!token) {
      router.push(`/${locale}/auth/login?redirect=/${locale}/checkout/${courseId}`)
    }
  }, [courseId, locale, router])

  const { data, isLoading } = useQuery({
    queryKey: ["checkout", courseId],
    queryFn: async () => {
      const res = await get(`/courses/${courseId}`)
      return res?.data?.data
    },
    enabled: !!courseId,
  })

  const course = data
  const courseType = course?.type || "recorded"
  const price = course?.price || 0
  const courseTitle = course?.titleAr || course?.titleEn || ""

  const getTypeIcon = () => {
    if (courseType === "live") return <Radio size={18} />
    if (courseType === "offline") return <MapPin size={18} />
    return <Video size={18} />
  }

  const getTypeLabel = () => {
    if (courseType === "live") return isAr ? "بث مباشر" : "Live Stream"
    if (courseType === "offline") return isAr ? "مقر فعلي" : "Physical Course"
    return isAr ? "كورس مسجل" : "Recorded Course"
  }

  const handleCheckout = async () => {
    const token = localStorage.getItem("deveway_token") || sessionStorage.getItem("deveway_token") || ""
    if (!token) { router.push(`/${locale}/auth/login`); return }
    
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`https://deve-way.onrender.com/api/payments/checkout/course/${courseId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ locale })
      })
      const data = await res.json()
      if (data?.data?.url) {
        window.location.href = data.data.url
      } else {
        throw new Error(data.message || "Failed to create checkout")
      }
    } catch(e: any) {
      setError(e.message || (isAr ? "حدث خطأ في الدفع" : "Payment error"))
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fafc" }}>
        <Loader2 className="h-8 w-8 animate-spin text-[#6c3ce0]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc", direction: isAr ? "rtl" : "ltr" }}>
      <div className="max-w-4xl mx-auto p-6 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Course Info */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-start gap-4 mb-6">
              {course?.thumbnail ? (
                <img src={getMediaUrl(course.thumbnail)} alt="" className="w-24 h-24 rounded-2xl object-cover" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-[#6c3ce0]/10 flex items-center justify-center">
                  {getTypeIcon()}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: "rgba(108,60,224,0.1)", color: "#6c3ce0" }}>
                    {getTypeLabel()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{courseTitle}</h2>
                <p className="text-sm text-gray-500">
                  {isAr ? "بواسطة" : "By"} {course?.instructor?.profile?.firstName || ""}
                </p>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{isAr ? "نوع الكورس" : "Course Type"}</span>
                <span className="font-semibold text-gray-900 flex items-center gap-2">
                  {getTypeIcon()} {getTypeLabel()}
                </span>
              </div>
              {course?.duration && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{isAr ? "المدة" : "Duration"}</span>
                  <span className="font-semibold text-gray-900">{course.duration} {isAr ? "ساعة" : "hours"}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-bold text-gray-900">{isAr ? "الاجمالي" : "Total"}</span>
                <span className="text-2xl font-black text-[#6c3ce0]">{price} {isAr ? "ريال" : "SAR"}</span>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#6c3ce0]/10 flex items-center justify-center">
                <BookOpen className="text-[#6c3ce0]" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {isAr ? "اتمام الشراء" : "Complete Purchase"}
                </h1>
                <p className="text-sm text-gray-500">
                  {isAr ? "دفع آمن ومشفر" : "Secure encrypted payment"}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3">
                <AlertTriangle className="text-red-500 mt-0.5" size={18} />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
                <CheckCircle2 className="text-green-500" size={20} />
                <span className="text-sm text-gray-600">
                  {isAr ? "دفع آمن عبر Stripe" : "Secure payment via Stripe"}
                </span>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50">
                <CheckCircle2 className="text-green-500" size={20} />
                <span className="text-sm text-gray-600">
                  {isAr ? "يمكنك الوصول فورا بعد الدفع" : "Instant access after payment"}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || price <= 0}
              className="w-full py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-3"
              style={{ background: "linear-gradient(135deg, #5120c8, #6c3ce0)", boxShadow: "0 8px 32px rgba(108,60,224,0.4)" }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {isAr ? "جاري التحويل..." : "Redirecting..."}
                </>
              ) : (
                <>
                  {isAr ? `ادفع ${price} ريال عبر Stripe` : `Pay ${price} SAR via Stripe`}
                  <ArrowRight size={20} style={{ transform: isAr ? "rotate(180deg)" : "none" }} />
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400 mt-6">
              {isAr ? "بالضغط على الزر، ستنتقل إلى صفحة دفع Stripe الآمنة" : "By clicking the button, you will be redirected to Stripe's secure payment page"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
