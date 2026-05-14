import CoachesDetailClient from './CoachesDetailClient'

export async function generateMetadata({ params }: { params: { locale: string; id: string } }) {
  const isAr = params.locale === 'ar'

  try {
    const API = process.env.NEXT_PUBLIC_API_URL || 'https://deve-way.onrender.com/api'
    const res = await fetch(`${API}/coaching/coaches/${encodeURIComponent(params.id)}`, {
      next: { revalidate: 3600 },
    })
    const data = await res.json()
    const coach = data?.data || data

    const name = coach?.name || ''
    const specialties = coach?.specialties?.join(', ') || ''
    const bio = isAr ? (coach?.bioAr || coach?.bioEn || '') : (coach?.bioEn || coach?.bioAr || '')

    return {
      title: name ? `${name} | DeveWay` : (isAr ? 'المستشار المهني | DeveWay' : 'Professional Coach | DeveWay'),
      description: specialties
        ? (isAr
            ? `${name} — مستشار مهني متخصص في ${specialties}`
            : `${name} — Professional coach specializing in ${specialties}`)
        : bio.slice(0, 160),
      alternates: {
        canonical: `https://www.deveways.com/${params.locale}/coaches/${params.id}`,
        languages: {
          'ar': `https://www.deveways.com/ar/coaches/${params.id}`,
          'en': `https://www.deveways.com/en/coaches/${params.id}`,
        },
      },
      openGraph: {
        title: name ? `${name} | DeveWay` : 'Professional Coach | DeveWay',
        description: specialties ? `${name} — ${specialties}` : bio.slice(0, 200),
        url: `https://www.deveways.com/${params.locale}/coaches/${params.id}`,
        locale: isAr ? 'ar_SA' : 'en_US',
      },
    }
  } catch {
    return {
      title: isAr ? 'المستشار المهني | DeveWay' : 'Professional Coach | DeveWay',
    }
  }
}

export default function Page() {
  return <CoachesDetailClient />
}
