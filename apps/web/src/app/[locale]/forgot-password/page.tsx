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

export default function ForgotPasswordPage() {
  const locale = useLocale() as 'ar' | 'en'
  const t = useTranslations('auth')
  const c = useTranslations('common')
  const f = useTranslations('forgot')
  const { forgotPassword } = useAuth()

  const schema = z.object({
    email: z.string().min(1, { message: t('errors.email_required') }).email({ message: t('errors.email_invalid') }),
  })
  type Values = z.infer<typeof schema>

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  return (
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{f('title')}</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">{f('subtitle')}</p>

        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit((v) => forgotPassword.mutate(v))}>
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
            {form.formState.errors.email?.message ? (
              <p className="text-xs font-semibold text-[color:var(--danger)]">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
            {forgotPassword.isPending ? c('loading') : f('submit')}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Link href={`/${locale}/login`} className="font-semibold text-primary hover:underline">
              {c('back')}
            </Link>
            <Link href={`/${locale}/reset-password`} className="font-semibold text-foreground hover:underline">
              {f('have_token')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

