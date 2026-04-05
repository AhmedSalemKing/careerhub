'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { CreditCard, Shield, Check, Lock, BookOpen } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import { Input } from '../../../../components/ui/input'

export default function CheckoutPage() {
  const t = useTranslations()
  const locale = useLocale() as 'ar' | 'en'
  const params = useParams()
  const courseId = params.id as string

  const [paymentMethod, setPaymentMethod] = useState<'paymob' | 'hyperpay'>('paymob')
  const [loading, setLoading] = useState(false)

  // بيانات وهمية
  const course = {
    id: courseId,
    title: {
      ar: 'أساسيات البرمجة بلغة Python',
      en: 'Python Programming Basics',
    },
    price: 199,
    currency: 'SAR',
    instructor: 'أحمد محمد',
  }

  const handlePayment = async () => {
    setLoading(true)
    // TODO: Implement payment logic
    setTimeout(() => {
      setLoading(false)
      alert(locale === 'ar' ? 'سيتم تحويلك لصفحة الدفع' : 'Redirecting to payment page...')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8 font-madinet">{t('checkout.title')}</h1>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Payment Form */}
          <div className="lg:col-span-3 space-y-6">
            <div className="rounded-2xl border bg-white p-6 dark:bg-gray-800">
              <h2 className="text-lg font-bold mb-4">{t('checkout.payment_method')}</h2>

              <div className="space-y-3">
                <button
                  onClick={() => setPaymentMethod('paymob')}
                  className={`w-full rounded-xl border p-4 text-right transition-colors ${paymentMethod === 'paymob'
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-6 w-6 text-primary" />
                      <div className="text-right">
                        <p className="font-semibold">{t('checkout.paymob')}</p>
                        <p className="text-sm text-muted-foreground">{t('checkout.paymob_desc')}</p>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 ${paymentMethod === 'paymob' ? 'border-primary bg-primary' : 'border-gray-300'
                      } flex items-center justify-center`}>
                      {paymentMethod === 'paymob' && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('hyperpay')}
                  className={`w-full rounded-xl border p-4 text-right transition-colors ${paymentMethod === 'hyperpay'
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-6 w-6 text-primary" />
                      <div className="text-right">
                        <p className="font-semibold">{t('checkout.hyperpay')}</p>
                        <p className="text-sm text-muted-foreground">{t('checkout.hyperpay_desc')}</p>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 ${paymentMethod === 'hyperpay' ? 'border-primary bg-primary' : 'border-gray-300'
                      } flex items-center justify-center`}>
                      {paymentMethod === 'hyperpay' && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 dark:bg-gray-800">
              <h2 className="text-lg font-bold mb-4">{t('checkout.card_details')}</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t('checkout.card_number')}</label>
                  <Input
                    type="text"
                    placeholder="**** **** **** ****"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">{t('checkout.expiry')}</label>
                    <Input
                      type="text"
                      placeholder="MM/YY"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">CVV</label>
                    <Input
                      type="text"
                      placeholder="***"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span>{t('checkout.secure')}</span>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border bg-white p-6 dark:bg-gray-800 sticky top-24">
              <h2 className="text-lg font-bold mb-4">{t('checkout.summary')}</h2>

              <div className="flex gap-4 mb-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold line-clamp-2">
                    {course.title[locale]}
                  </h3>
                  <p className="text-sm text-muted-foreground">{course.instructor}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t('checkout.subtotal')}</span>
                  <span>{course.price} {course.currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('checkout.discount')}</span>
                  <span className="text-green-500">-0 {course.currency}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>{t('checkout.total')}</span>
                  <span className="text-primary">{course.price} {course.currency}</span>
                </div>
              </div>

              <Button
                className="w-full mt-6"
                size="lg"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? t('checkout.processing') : t('checkout.pay')}
              </Button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>{t('checkout.guarantee')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}