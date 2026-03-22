'use client'

import { useEffect } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useMutation, useQuery } from '@tanstack/react-query'
import { get, patch } from '../../../../lib/api'
import { unwrap } from '../../../../lib/unwrap'
import { AuthGate } from '../../../components/AuthGate'
import { DashboardShell } from '../../../components/DashboardShell'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../../lib/toast'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { useAuthStore } from '../../../../stores/authStore'
import { User, Mail, Phone, Globe, Languages } from 'lucide-react'

type Profile = {
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  language?: string | null
  country?: string | null
} & Record<string, unknown>

export default function DashboardSettingsPage() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('settingsPage')
  const c = useTranslations('common')
  const e = useTranslations('errors')
  const { toast } = useToast()
  const { user, setUser } = useAuthStore()

  const q = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await get('/users/profile')
      const data = unwrap(res) as any
      return (data?.profile ?? data?.data?.profile ?? null) as Profile | null
    },
  })

  const schema = z.object({
    firstName: z.string().min(1, { message: t('first_required') }),
    lastName: z.string().min(1, { message: t('last_required') }),
    phone: z.string().optional(),
    country: z.string().optional(),
  })
  type Values = z.infer<typeof schema>

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', phone: '', country: '' },
  })

  useEffect(() => {
    if (q.data) {
      form.reset({
        firstName: q.data.firstName ?? '',
        lastName: q.data.lastName ?? '',
        phone: q.data.phone ?? '',
        country: q.data.country ?? '',
      })
    }
  }, [q.data, form])

  const saveMutation = useMutation({
    mutationFn: async (values: Values) => {
      const res = await patch('/users/profile', { ...values, language: locale })
      const data = unwrap(res) as any
      return (data?.profile ?? data?.data?.profile ?? null) as Profile | null
    },
    onSuccess: (profile) => {
      toast({ variant: 'success', title: t('saved'), description: t('saved') })
      if (profile) {
        const nextUser = user
          ? ({ ...user, profile: { ...(user.profile ?? {}), ...profile } } as any)
          : null
        setUser(nextUser)
        if (nextUser) {
          localStorage.setItem('careerhub_user', JSON.stringify(nextUser))
        }
      }
    },
    onError: () => toast({ variant: 'danger', title: t('title'), description: e('something_wrong') }),
  })

  return (
    <AuthGate>
      <DashboardShell title={t('title')} subtitle={t('subtitle')} backHref="/dashboard">
        <div className="max-w-4xl space-y-8">
          {/* Profile Overview Card */}
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm sm:p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-12 w-12" />
              </div>
              <div className="text-center sm:text-left rtl:sm:text-right">
                <h2 className="text-2xl font-black text-foreground">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </h2>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-3 text-sm text-[color:var(--muted)] sm:justify-start">
                  <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {user?.email}</span>
                  <span className="flex items-center gap-1 uppercase tracking-widest font-black text-primary/80">
                    <ShieldCheck className="h-3.5 w-3.5" /> {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm overflow-hidden">
            <div className="border-b border-[color:var(--border)] bg-gray-50/50 p-6 dark:bg-gray-800/50">
              <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{t('edit_profile')}</h3>
            </div>
            
            {q.isLoading ? (
              <div className="p-6 space-y-6">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ) : (
              <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('first_name')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
                      <Input id="firstName" {...form.register('firstName')} className="pl-10" />
                    </div>
                    {form.formState.errors.firstName && <p className="text-xs font-bold text-red-500">{form.formState.errors.firstName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('last_name')}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
                      <Input id="lastName" {...form.register('lastName')} className="pl-10" />
                    </div>
                    {form.formState.errors.lastName && <p className="text-xs font-bold text-red-500">{form.formState.errors.lastName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('phone')}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
                      <Input id="phone" {...form.register('phone')} className="pl-10" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">{t('country')}</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
                      <select 
                        id="country" 
                        {...form.register('country')}
                        className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] py-2 pl-10 pr-4 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none h-11"
                      >
                        <option value="EG">مصر (Egypt)</option>
                        <option value="SA">المملكة العربية السعودية (Saudi Arabia)</option>
                        <option value="AE">الإمارات العربية المتحدة (UAE)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[color:var(--border)] flex justify-end">
                  <Button type="submit" disabled={saveMutation.isPending} className="w-full sm:w-auto px-12">
                    {saveMutation.isPending ? c('loading') : t('save_changes')}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Preferences Section */}
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <Languages className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-black text-foreground uppercase tracking-widest">{t('preferences')}</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">{t('interface_language')}</p>
                <p className="text-xs text-[color:var(--muted)]">{t('language_desc')}</p>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                <button className={`rounded-lg px-4 py-1.5 text-xs font-black uppercase transition-all ${locale === 'ar' ? 'bg-white text-primary shadow-sm dark:bg-gray-700' : 'text-[color:var(--muted)]'}`}>AR</button>
                <button className={`rounded-lg px-4 py-1.5 text-xs font-black uppercase transition-all ${locale === 'en' ? 'bg-white text-primary shadow-sm dark:bg-gray-700' : 'text-[color:var(--muted)]'}`}>EN</button>
              </div>
            </div>
          </div>
        </div>
      </DashboardShell>
    </AuthGate>
  )
}

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
      <path d="m9 12 2 2 4-4"></path>
    </svg>
  )
}
