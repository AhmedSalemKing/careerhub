import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Button } from '../../components/ui/button'

export const metadata: Metadata = {
  title: 'Dashboard - DeveWay Learn',
  description: 'Your learning dashboard',
}

export default async function DashboardPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  const t = await getTranslations('dashboard')

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('welcome')}</h1>
        <p className="text-muted-foreground">{t('overview')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">{t('courses')}</h2>
          <p className="text-muted-foreground mb-4">{t('enrolled_courses')}</p>
          <Link href="/courses">
            <Button>View Courses</Button>
          </Link>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">{t('certificates')}</h2>
          <p className="text-muted-foreground mb-4">{t('certificates_earned')}</p>
          <Button variant="outline" disabled>
            View Certificates
          </Button>
        </div>

        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">{t('settings')}</h2>
          <p className="text-muted-foreground mb-4">Manage your profile</p>
          <Button variant="outline" disabled>
            Settings
          </Button>
        </div>
      </div>
    </div>
  )
}
