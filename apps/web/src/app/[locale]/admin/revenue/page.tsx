'use client'
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../../../../lib/api';
import { TrendingUp, DollarSign, BookOpen, CreditCard, CheckCircle2, Calendar } from 'lucide-react';

function useIsAr(): boolean {
  const [isAr, setIsAr] = React.useState(false);
  React.useEffect(() => {
    try { setIsAr((navigator.language || 'en').startsWith('ar')) } catch { setIsAr(false) }
  }, []);
  return isAr;
}

export default function AdminRevenuePage() {
  const isAr = useIsAr();
  const [tab, setTab] = useState<'payments' | 'sessions'>('payments');

  const { data: paymentsData, isLoading: loadingP } = useQuery({
    queryKey: ['admin-payments-confirmed'],
    queryFn: async () => {
      const res = await get('/admin/payments');
      return res?.data ?? { data: [], total: 0 };
    },
  });

  const { data: sessionsData, isLoading: loadingS } = useQuery({
    queryKey: ['admin-sessions-paid'],
    queryFn: async () => {
      const res = await get('/admin/sessions');
      return res?.data ?? { data: [] };
    },
  });

  const allPayments: any[] = paymentsData?.data ?? [];
  const payments = allPayments.filter(p => p.status === 'SUCCESS' || p.status === 'COMPLETED');

  const allSessions: any[] = sessionsData?.data ?? [];
  const paidSessions = allSessions.filter(s => s.paymentStatus === 'PAID');

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const paymentTotal = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const sessionTotal = paidSessions.reduce((sum: number, s: any) => sum + Number(s.price || 0), 0);
  const total = paymentTotal + sessionTotal;

  const monthlyPayments = payments.filter(p => new Date(p.createdAt) >= monthStart).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const monthlySessions = paidSessions.filter(s => new Date(s.createdAt) >= monthStart).reduce((sum: number, s: any) => sum + Number(s.price || 0), 0);
  const monthlyRevenue = monthlyPayments + monthlySessions;

  const cards = [
    { label: isAr ? 'إجمالي الإيرادات' : 'Total Revenue', value: `${total.toFixed(2)} ريال`, icon: DollarSign, color: '#22C55E' },
    { label: isAr ? 'إيرادات الكورسات' : 'Course Revenue', value: `${paymentTotal.toFixed(2)} ريال`, icon: BookOpen, color: '#5120c8' },
    { label: isAr ? 'إيرادات الجلسات' : 'Session Revenue', value: `${sessionTotal.toFixed(2)} ريال`, icon: Calendar, color: '#8B5CF6' },
    { label: isAr ? 'إيرادات الشهر' : 'Monthly Revenue', value: `${monthlyRevenue.toFixed(2)} ريال`, icon: TrendingUp, color: '#F59E0B' },
  ];

  return (
    <div className="p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-3xl font-bold text-foreground">💰 {isAr ? 'الإيرادات المؤكدة' : 'Confirmed Revenue Dashboard'}</h1>
        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
          ✓ {isAr ? 'مدفوعات مؤكدة + جلسات مدفوعة' : 'Confirmed payments + PAID sessions'}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {cards.map((s, i) => (
          <div key={i} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5 hover:border-[color:var(--primary)]/30 transition-all">
            <s.icon className="h-8 w-8 mb-3" style={{ color: s.color }} />
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-[color:var(--muted)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'payments', label: isAr ? 'مدفوعات الكورسات' : 'Course Payments' },
          { key: 'sessions', label: isAr ? 'جلسات مدفوعة' : 'Paid Sessions' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'bg-[#5120c8] text-white' : 'bg-[color:var(--surface)] text-[color:var(--muted)] border border-[color:var(--border)]'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Payments Table */}
      {tab === 'payments' && (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
          <div className="p-5 border-b border-[color:var(--border)] flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <h2 className="font-bold text-foreground">{isAr ? 'مدفوعات الكورسات المؤكدة' : 'Confirmed Course Payments'}</h2>
            <span className="ml-auto text-sm text-[color:var(--muted)]">{payments.length} {isAr ? 'عملية' : 'transactions'}</span>
          </div>
          {loadingP ? (
            <div className="p-8 text-center text-[color:var(--muted)]">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center text-[color:var(--muted)]">
              <CheckCircle2 className="mx-auto h-12 w-12 mb-3 opacity-30 text-green-500" />
              <p className="font-semibold">{isAr ? 'لا توجد مدفوعات مؤكدة' : 'No confirmed payments yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[color:var(--surface-2)]">
                  <tr>
                    <th className="p-3 text-right text-[color:var(--muted)] font-medium">#</th>
                    <th className="p-3 text-right text-[color:var(--muted)] font-medium">{isAr ? 'المستخدم' : 'User'}</th>
                    <th className="p-3 text-right text-[color:var(--muted)] font-medium">{isAr ? 'الكورس' : 'Course'}</th>
                    <th className="p-3 text-right text-[color:var(--muted)] font-medium">{isAr ? 'المبلغ' : 'Amount'}</th>
                    <th className="p-3 text-right text-[color:var(--muted)] font-medium">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="p-3 text-right text-[color:var(--muted)] font-medium">{isAr ? 'التاريخ' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any, idx: number) => {
                    const name = p.user?.profile ? `${p.user.profile.firstName} ${p.user.profile.lastName}` : p.user?.email ?? '—';
                    const courseTitle = p.course?.titleAr || p.course?.titleEn || '—';
                    return (
                      <tr key={p.id} className="border-t border-[color:var(--border)] hover:bg-[color:var(--surface-2)] transition">
                        <td className="p-3 text-[color:var(--muted)]">{idx + 1}</td>
                        <td className="p-3 text-foreground font-medium">{name}</td>
                        <td className="p-3 text-[color:var(--muted)]">{courseTitle}</td>
                        <td className="p-3 font-bold text-green-500">{Number(p.amount).toFixed(2)} {p.currency || 'SAR'}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-green-500/15 text-green-400 border border-green-500/25">
                            <CheckCircle2 size={12} />
                            {p.status === 'SUCCESS' ? (isAr ? 'ناجح' : 'Success') : (isAr ? 'مكتمل' : 'Completed')}
                          </span>
                        </td>
                        <td className="p-3 text-[color:var(--muted)] text-xs">{new Date(p.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sessions Table */}
      {tab === 'sessions' && (
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] overflow-hidden">
          <div className="p-5 border-b border-[color:var(--border)] flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            <h2 className="font-bold text-foreground">{isAr ? 'الجلسات المدفوعة' : 'Paid Consulting Sessions'}</h2>
            <span className="ml-auto text-sm text-[color:var(--muted)]">{paidSessions.length} {isAr ? 'جلسة' : 'sessions'}</span>
          </div>
          {loadingS ? (
            <div className="p-8 text-center text-[color:var(--muted)]">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>
          ) : paidSessions.length === 0 ? (
            <div className="p-8 text-center text-[color:var(--muted)]">
              <Calendar className="mx-auto h-12 w-12 mb-3 opacity-30 text-purple-500" />
              <p className="font-semibold">{isAr ? 'لا توجد جلسات مدفوعة' : 'No paid sessions yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[color:var(--surface-2)]">
                  <tr>
                    <th className="p-3 text-right text-[color:var(--muted)] font-medium">#</th>
                    <th className="p-3 text-right text-[color:var(--muted)] font-medium">{isAr ? 'الطالب' : 'Student'}</th>
                    <th className="p-3 text-right text-[color:var(--muted)] font-medium">{isAr ? 'المستشار' : 'Consultant'}</th>
                    <th className="p-3 text-right text-[color:var(--muted)] font-medium">{isAr ? 'الموضوع' : 'Topic'}</th>
                    <th className="p-3 text-right text-[color:var(--muted)] font-medium">{isAr ? 'السعر' : 'Price'}</th>
                    <th className="p-3 text-right text-[color:var(--muted)] font-medium">{isAr ? 'التاريخ' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  {paidSessions.map((s: any, idx: number) => {
                    const student = s.student?.profile ? `${s.student.profile.firstName} ${s.student.profile.lastName}` : s.student?.email ?? '—';
                    const consultant = s.consultant?.profile ? `${s.consultant.profile.firstName} ${s.consultant.profile.lastName}` : s.consultant?.email ?? '—';
                    return (
                      <tr key={s.id} className="border-t border-[color:var(--border)] hover:bg-[color:var(--surface-2)] transition">
                        <td className="p-3 text-[color:var(--muted)]">{idx + 1}</td>
                        <td className="p-3 text-foreground font-medium">{student}</td>
                        <td className="p-3 text-[color:var(--muted)]">{consultant}</td>
                        <td className="p-3 text-[color:var(--muted)]">{s.topic || '—'}</td>
                        <td className="p-3 font-bold text-purple-400">{Number(s.price).toFixed(2)} ريال</td>
                        <td className="p-3 text-[color:var(--muted)] text-xs">{new Date(s.scheduledAt || s.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 p-5 rounded-2xl border border-green-500/25 bg-green-500/5">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <div>
            <p className="font-bold text-green-400">{isAr ? 'ملخص الإيرادات' : 'Revenue Summary'}</p>
            <p className="text-sm text-green-500/70 mt-1">
              {isAr
                ? `كورسات: ${paymentTotal.toFixed(2)} ريال | جلسات: ${sessionTotal.toFixed(2)} ريال | الإجمالي: ${total.toFixed(2)} ريال`
                : `Courses: ${paymentTotal.toFixed(2)} SAR | Sessions: ${sessionTotal.toFixed(2)} SAR | Total: ${total.toFixed(2)} SAR`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
