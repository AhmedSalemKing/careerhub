'use client'
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../../../../lib/api';
import { TrendingUp, DollarSign, BookOpen, CreditCard, CheckCircle2 } from 'lucide-react';

// ✅ FIXED: Simple isAr detection without hooks
function useIsAr(): boolean {
  const [isAr, setIsAr] = React.useState(false);
  
  React.useEffect(() => {
    try {
      const lang = navigator.language || 'en';
      setIsAr(lang.startsWith('ar'));
    } catch(e) {
      setIsAr(false);
    }
  }, []);
  
  return isAr;
}

export default function AdminRevenuePage() {
  // ✅ FIXED: Now using custom hook instead of missing hooks
  const isAr = useIsAr();

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['admin-payments-confirmed'],
    queryFn: async () => {
      const res = await get('/admin/payments');
      return res?.data ?? { data: [], total: 0 }
    },
  });

  // ✅ FIXED: Filter to ensure ONLY SUCCESS/COMPLETED are shown
  const allPayments: any[] = paymentsData?.data ?? [];
  const payments = allPayments.filter(
    (p) => p.status === 'SUCCESS' || p.status === 'COMPLETED',
  );
  
  // Calculate totals from confirmed payments only
  const total = payments.reduce((sum: number, p: any) => sum + p.amount, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRevenue = payments
    .filter((p) => new Date(p.createdAt) >= monthStart)
    .reduce((sum: number, p: any) => sum + p.amount, 0);
  const today = payments
    .filter((p) => new Date(p.createdAt).toDateString() === now.toDateString())
    .reduce((sum: number, p: any) => sum + p.amount, 0);
  const totalSales = payments.length;

  const cards = [
    {
      label: isAr ? 'إجمالي الإيرادات المؤكدة' : 'Total Confirmed Revenue',
      value: `${total.toFixed(2)} ريال`,
      icon: DollarSign,
      color: '#22C55E',
    },
    {
      label: isAr ? 'إيرادات الشهر المؤكد دفعها' : 'Monthly Confirmed Revenue',
      value: `${monthlyRevenue.toFixed(2)} ريال`,
      icon: TrendingUp,
      color: '#3B82F6',
    },
    {
      label: isAr ? 'إيرادات اليوم المؤكد دفعها' : "Today's Confirmed Revenue",
      value: `${today.toFixed(2)} ريال`,
      icon: CheckCircle2,
      color: '#8B5CF6',
    },
    {
      label: isAr ? 'إجمالي المبيعات المؤكدة' : 'Total Confirmed Sales',
      value: String(totalSales),
      icon: BookOpen,
      color: '#F59E0B',
    },
  ];

  return (
    <div className="p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-3xl font-bold text-foreground">💰 {isAr ? 'الإيرادات المؤكدة' : 'Confirmed Revenue Dashboard'}</h1>
        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
          ✓ {isAr ? 'فقط المدفوعات المؤكدة فقط' : 'Showing confirmed payments ONLY'}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {cards.map((s, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 hover:border-[color:var(--primary)]/30 transition-all"
          >
            <s.icon className="h-8 w-8 mb-3" style={{ color: s.color }} />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-[color:var(--muted)]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
        <div className="p-5 border-b border-[color:var(--border)] flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <h2 className="font-bold text-foreground">{isAr ? 'سجل المدفوعات المؤكدة' : 'Confirmed Payments Log'}</h2>
          <span className="ml-auto text-sm text-[color:var(--muted)]">
            {payments.length} {isAr ? 'عملية' : 'transactions'}
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-[color:var(--muted)]">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-[color:var(--muted)]">
            <CheckCircle2 className="mx-auto h-12 w-12 mb-3 opacity-30 text-green-500" />
            <p className="font-semibold">{isAr ? 'لا توجد مدفوعات مؤكدة بعد' : 'No confirmed payments yet'}</p>
            <p className="text-sm opacity-70 mt-1">
              {isAr ? 'سيظهر هنا المدفوعات بعد تأكيدها من البنك أو بوابة الدفع' : 'Confirmed payments will appear after bank/payment confirmation'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[color:var(--surface-2)]">
                <tr>
                  <th className="p-3 text-right text-[color:var(--muted)] font-medium">#</th>
                  <th className="p-3 text-right text-[color:var(--muted)] font-medium">{isAr ? 'المستخدم' : 'User'}</th>
                  <th className="p-3 text-right text-[color:var(--muted)] font-medium">{isAr ? 'الكورس' : 'Course'}</th>
                  {/* ✅ FIXED: Corrected CSS variable syntax */}
                  <th className="p-3 text-right text-[color:var(--muted)] font-medium">{isAr ? 'المبلغ' : 'Amount'}</th>
                  {/* ✅ FIXED: Changed ':' to '?' for ternary operator */}
                  <th className="p-3 text-right text-[color:var(--muted)] font-medium">{isAr ? 'الطريقة' : 'Method'}</th>
                  {/* ✅ FIXED: Changed ':' to '?' for ternary operator */}
                  <th className="p-3 text-right text-[color:var(--muted)] font-medium">{isAr ? 'الحالة' : 'Status'}</th>
                  {/* ✅ FIXED: Changed ':' to '?' for ternary operator */}
                  <th className="p-3 text-right text-[color:var(--muted)] font-medium">{isAr ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: any, idx: number) => {
                  const name = p.user?.profile
                    ? `${p.user.profile.firstName} ${p.user.profile.lastName}`
                    : p.user?.email ?? '—';
                  const courseTitle =
                    p.course?.titleAr || p.course?.titleEn || p.course?.title || '—';
                  
                  return (
                    <tr key={p.id}
                      className="border-t border-[color:var(--border)] hover:bg-[color:var(--surface-2)] transition"
                    >
                      <td className="p-3 text-[color:var(--muted)]">{idx + 1}</td>
                      <td className="p-3 text-foreground font-medium">{name}</td>
                      <td className="p-3 text-[color:var(--muted)]">{courseTitle}</td>
                      <td className="p-3 font-bold text-green-500">{p.amount.toFixed(2)} {p.currency}</td>
                      <td className="p-3 text-[color:var(--muted)]">{p.method || '—'}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/25">
                          <CheckCircle2 size={12} />
                          {p.status === 'SUCCESS' ? (isAr ? 'ناجح' : 'Success') : (isAr ? 'مكتمل' : 'Completed')}
                        </span>
                      </td>
                      <td className="p-3 text-[color:var(--muted)] text-xs">
                        {new Date(p.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Box */}
      <div className="mt-6 p-5 rounded-2xl border border-green-500/25 bg-green-500/5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <div>
            <p className="font-bold text-green-400">{isAr ? 'ملخص الإيرادات' : 'Revenue Summary'}</p>
            <p className="text-sm text-green-500/70 mt-1">
              {isAr 
                ? 'هذا التقرير يعرض فقط المدفوعات التي تم تأكيدها بنجاح (SUCCESS / COMPLETED). لا يتم احتساب المدفوعات المعلقة (PENDING) أو الملغاة.' 
                : 'This report shows ONLY confirmed payments (SUCCESS / COMPLETED). Pending or cancelled payments are NOT included.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}