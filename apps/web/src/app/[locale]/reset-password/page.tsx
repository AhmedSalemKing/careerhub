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

export default function ResetPasswordPage() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('auth')
  const c = useTranslations('common')
  const r = useTranslations('reset')
  const { resetPassword } = useAuth()

  const schema = z
    .object({
      token: z.string().min(1, { message: r('token_required') }),
      newPassword: z
        .string()
        .min(1, { message: t('errors.password_required') })
        .min(8, { message: t('errors.password_min') }),
      confirmPassword: z
        .string()
        .min(1, { message: t('errors.password_required') })
        .min(8, { message: t('errors.password_min') }),
    })
    .refine((v) => v.newPassword === v.confirmPassword, { message: t('errors.passwords_not_match'), path: ['confirmPassword'] })

  type Values = z.infer<typeof schema>

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { token: '', newPassword: '', confirmPassword: '' },
  })

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{r('title')}</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">{r('subtitle')}</p>

        <form
          className="mt-6 space-y-4"
          onSubmit={form.handleSubmit((v) => resetPassword.mutate({ token: v.token, newPassword: v.newPassword }))}
        >
          <div className="space-y-2">
            <Label htmlFor="token">{r('token')}</Label>
            <Input id="token" autoComplete="one-time-code" {...form.register('token')} />
            {form.formState.errors.token?.message ? (
              <p className="text-xs font-semibold text-[color:var(--danger)]">{form.formState.errors.token.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">{r('new_password')}</Label>
            <Input id="newPassword" type="password" autoComplete="new-password" {...form.register('newPassword')} />
            {form.formState.errors.newPassword?.message ? (
              <p className="text-xs font-semibold text-[color:var(--danger)]">{form.formState.errors.newPassword.message}</p>
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

          <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
            {resetPassword.isPending ? c('loading') : r('submit')}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Link href={`/${locale}/login`} className="font-semibold text-primary hover:underline">
              {c('back')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

