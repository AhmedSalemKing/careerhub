'use client'
import { useQuery } from '@tanstack/react-query'
import { get } from '../../../../lib/api'
import { TrendingUp, DollarSign, BookOpen, CreditCard } from 'lucide-react'

export default function AdminRevenuePage() {
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const res = await get<any>('/admin/payments')
      return res?.data ?? { data: [], total: 0 }
    },
  })

  const payments: any[] = paymentsData?.data ?? []
  const total = paymentsData?.total ?? 0

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthlyRevenue = payments
    .filter((p) => p.status === 'SUCCESS' || p.status === 'COMPLETED')
    .filter((p) => new Date(p.createdAt) >= monthStart)
    .reduce((sum: number, p: any) => sum + p.amount, 0)

  const today = payments
    .filter((p) => p.status === 'SUCCESS' || p.status === 'COMPLETED')
    .filter((p) => new Date(p.createdAt).toDateString() === now.toDateString())
    .reduce((sum: number, p: any) => sum + p.amount, 0)

  const totalSales = payments.filter(
    (p) => p.status === 'SUCCESS' || p.status === 'COMPLETED',
  ).length

  const cards = [
    { label: 'إجمالي الإيرادات', value: `${total.toFixed(0)} ريال`, icon: DollarSign },
    { label: 'إيرادات الشهر', value: `${monthlyRevenue.toFixed(0)} ريال`, icon: TrendingUp },
    { label: 'إيرادات اليوم', value: `${today.toFixed(0)} ريال`, icon: DollarSign },
    { label: 'إجمالي المبيعات', value: String(totalSales), icon: BookOpen },
  ]

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-3xl font-bold font-madinet text-foreground mb-6">الإيرادات</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {cards.map((s, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5"
          >
            <s.icon className="h-8 w-8 text-primary mb-3" />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-[color:var(--muted)]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
        <div className="p-5 border-b border-[color:var(--border)] flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-foreground">سجل المدفوعات</h2>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-[color:var(--muted)]">جاري التحميل...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-[color:var(--muted)]">
            <TrendingUp className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p>لا توجد مدفوعات بعد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[color:var(--surface-2)]">
                <tr>
                  <th className="p-3 text-right text-[color:var(--muted)] font-medium">المستخدم</th>
                  <th className="p-3 text-right text-[color:var(--muted)] font-medium">الكورس</th>
                  <th className="p-3 text-right text-[color:var(--muted)] font-medium">المبلغ</th>
                  <th className="p-3 text-right text-[color:var(--muted)] font-medium">الطريقة</th>
                  <th className="p-3 text-right text-[color:var(--muted)] font-medium">الحالة</th>
                  <th className="p-3 text-right text-[color:var(--muted)] font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any) => {
                  const name = p.user?.profile
                    ? `${p.user.profile.firstName} ${p.user.profile.lastName}`
                    : p.user?.email ?? '—'
                  const courseTitle =
                    p.course?.titleAr || p.course?.titleEn || p.course?.title || '—'
                  const isSuccess = p.status === 'SUCCESS' || p.status === 'COMPLETED'
                  return (
                    <tr
                      key={p.id}
                      className="border-t border-[color:var(--border)] hover:bg-[color:var(--surface-2)] transition"
                    >
                      <td className="p-3 text-foreground">{name}</td>
                      <td className="p-3 text-[color:var(--muted)]">{courseTitle}</td>
                      <td className="p-3 font-bold text-primary">{p.amount} {p.currency}</td>
                      <td className="p-3 text-[color:var(--muted)]">{p.method}</td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isSuccess
                              ? 'bg-green-500/10 text-green-400'
                              : p.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {isSuccess ? 'مكتمل' : p.status === 'PENDING' ? 'معلق' : p.status}
                        </span>
                      </td>
                      <td className="p-3 text-[color:var(--muted)] text-xs">
                        {new Date(p.createdAt).toLocaleDateString('ar-SA')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
