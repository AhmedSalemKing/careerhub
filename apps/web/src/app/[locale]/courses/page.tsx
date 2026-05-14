export async function generateMetadata({ params }: { params: { locale: string } }) {
  const isAr = params.locale === 'ar'
  return {
    title: isAr ? 'الكورسات | DeveWay' : 'Courses | DeveWay',
    description: isAr
      ? 'استعرض مئات الكورسات التعليمية الاحترافية في البرمجة والتصميم والتسويق وبناء المسار المهني'
      : 'Browse hundreds of professional courses in programming, design, marketing, and career building',
    alternates: {
      canonical: `https://www.deveways.com/${params.locale}/courses`,
      languages: {
        'ar': 'https://www.deveways.com/ar/courses',
        'en': 'https://www.deveways.com/en/courses',
      },
    },
  }
}

export default function Page() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Courses</h1>
      <p className="mt-4 text-[color:var(--muted)]">Our course catalog is coming soon.</p>
    </main>
  );
}
