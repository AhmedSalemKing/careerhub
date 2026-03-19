'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../../hooks/useAuth'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'

export default function RegisterPage() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('auth')
  const c = useTranslations('common')
  const { register } = useAuth()

  const schema = z
    .object({
      fullName: z.string().min(1, { message: t('errors.name_required') }),
      email: z.string().min(1, { message: t('errors.email_required') }).email({ message: t('errors.email_invalid') }),
      password: z.string().min(1, { message: t('errors.password_required') }).min(8, { message: t('errors.password_min') }),
      confirmPassword: z
        .string()
        .min(1, { message: t('errors.password_required') })
        .min(8, { message: t('errors.password_min') }),
      country: z.string().optional(),
    })
    .refine((v) => v.password === v.confirmPassword, { message: t('errors.passwords_not_match'), path: ['confirmPassword'] })

  type Values = z.infer<typeof schema>

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', country: '' },
  })

  const onSubmit = (values: Values) => {
    const parts = values.fullName.trim().split(/\s+/)
    const firstName = parts[0] || values.fullName
    const lastName = parts.slice(1).join(' ') || '-'

    register.mutate({
      email: values.email,
      password: values.password,
      firstName,
      lastName,
      country: values.country || undefined,
      language: locale,
    })
  }

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{t('register_title')}</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">{t('no_account')}</p>

        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="fullName">{t('full_name')}</Label>
            <Input id="fullName" autoComplete="name" {...form.register('fullName')} />
            {form.formState.errors.fullName?.message ? (
              <p className="text-xs font-semibold text-[color:var(--danger)]">{form.formState.errors.fullName.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
            {form.formState.errors.email?.message ? (
              <p className="text-xs font-semibold text-[color:var(--danger)]">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('password')}</Label>
            <Input id="password" type="password" autoComplete="new-password" {...form.register('password')} />
            {form.formState.errors.password?.message ? (
              <p className="text-xs font-semibold text-[color:var(--danger)]">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirm_password')}</Label>
            <Input id="confirmPassword" type="password" autoComplete="new-password" {...form.register('confirmPassword')} />
            {form.formState.errors.confirmPassword?.message ? (
              <p className="text-xs font-semibold text-[color:var(--danger)]">
                {form.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">{t('country')}</Label>
            <Input id="country" autoComplete="country-name" {...form.register('country')} />
          </div>

          <Button type="submit" className="w-full" disabled={register.isPending}>
            {register.isPending ? c('loading') : t('register_btn')}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Link href={`/${locale}/login`} className="font-semibold text-primary hover:underline">
              {t('have_account')}
            </Link>
            <Link href={`/${locale}/terms`} className="font-semibold text-foreground hover:underline">
              {t('terms')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

