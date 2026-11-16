import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { UserAvatar } from '../../../../components/UserAvatar'
import { API_URL } from '../../../../lib/constants'
import { getCourseTitle, getMediaUrl } from '../../../../lib/media'

interface PageProps {
  params: { locale: string; userId: string }
}

interface InstructorCourse {
  id: string
  titleAr?: string | null
  titleEn?: string | null
  slug?: string | null
  thumbnail?: string | null
  price?: number | null
  currency?: string | null
  _count?: { enrollments?: number }
}

interface InstructorProfile {
  id: string
  accountType?: string
  joinedAt?: string
  profile?: {
    firstName?: string | null
    lastName?: string | null
    gender?: string | null
    avatar?: string | null
    bio?: string | null
    speciality?: string | null
  } | null
  stats?: {
    publishedCourses?: number
    totalStudents?: number
  }
  courses?: InstructorCourse[]
}

async function fetchInstructor(userId: string): Promise<InstructorProfile | null> {
  try {
    const res = await fetch(`${API_URL}/users/profile/${encodeURIComponent(userId)}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const json = await res.json()
    return (json?.data as InstructorProfile) ?? null
  } catch {
    return null
  }
}

function displayName(p: InstructorProfile): string {
  return `${p.profile?.firstName ?? ''} ${p.profile?.lastName ?? ''}`.trim()
}

// Theme tokens come from the app's CSS variables (globals.css), which switch with the `.dark` class, so the
// page reads correctly in both light and dark mode. Colors are applied inline on purpose: the Tailwind color
// names for these variables don't support opacity modifiers, and globals.css remaps text-white/bg-gray-* in light mode.
const C = {
  bg: 'var(--bg)',
  ink: 'var(--ink)',
  ink2: 'var(--ink-2)',
  ink3: 'var(--ink-3)',
  line: 'var(--line)',
  surface: 'var(--surface)',
  surface2: 'var(--surface-2)',
  brandLine: 'color-mix(in srgb, var(--brand) 30%, transparent)',
  brandSoft: 'color-mix(in srgb, var(--brand) 12%, transparent)',
  // brand blended toward the text color: stays readable on light and on dark backgrounds
  accent: 'color-mix(in srgb, var(--brand) 65%, var(--ink))',
  heroGradient: 'linear-gradient(to bottom, color-mix(in srgb, var(--brand) 12%, transparent), var(--bg))',
}
const chipStyle = { background: C.brandSoft, borderColor: C.brandLine, color: C.accent }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const instructor = await fetchInstructor(params.userId)
  const name = instructor ? displayName(instructor) : ''
  return { title: `${name || 'Instructor'} | DeveWay` }
}

function formatPrice(price: number | null | undefined, currency: string | null | undefined, isAr: boolean): string {
  if (!price) return isAr ? 'مجاني' : 'Free'
  return `${price} ${currency || 'USD'}`
}

export default async function InstructorProfilePage({ params }: PageProps) {
  const { locale, userId } = params
  const isAr = locale === 'ar'

  // The profile endpoint embeds the published courses, so one request serves both.
  const instructor = await fetchInstructor(userId)
  if (!instructor) notFound()

  const name = displayName(instructor)
  const courses = instructor.courses ?? []
  const stats = instructor.stats ?? {}
  const align = isAr ? 'text-right' : 'text-left'
  const joined = instructor.joinedAt
    ? new Date(instructor.joinedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long' })
    : null
  const chip = 'border rounded-full px-3 py-1 text-sm'

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className={`min-h-screen ${align}`} style={{ background: C.bg, color: C.ink }}>
      <section className="py-16" style={{ background: C.heroGradient }}>
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row gap-6 items-start">
          <span className="rounded-full flex-shrink-0 inline-flex" style={{ boxShadow: `0 0 0 4px ${C.brandLine}` }}>
            <UserAvatar user={{ photo: instructor.profile?.avatar, gender: instructor.profile?.gender, name }} size={96} />
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold" style={{ color: C.ink }}>{name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={chip} style={chipStyle}>{isAr ? 'محاضر' : 'Instructor'}</span>
              {instructor.profile?.speciality && <span className={chip} style={chipStyle}>{instructor.profile.speciality}</span>}
              {joined && (
                <span className="text-sm" style={{ color: C.ink3 }}>
                  {isAr ? 'انضم في' : 'Joined'} {joined}
                </span>
              )}
            </div>
            {instructor.profile?.bio && (
              <p className="leading-relaxed max-w-2xl mt-4" style={{ color: C.ink2 }}>{instructor.profile.bio}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-6">
              <StatCard value={String(stats.publishedCourses ?? courses.length)} label={isAr ? 'كورس' : 'Courses'} />
              <StatCard value={String(stats.totalStudents ?? 0)} label={isAr ? 'طالب' : 'Students'} />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-16">
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-2xl font-bold" style={{ color: C.ink }}>{isAr ? 'الكورسات' : 'Courses'}</h2>
          <span className={chip} style={chipStyle}>{courses.length}</span>
        </div>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center py-16" style={{ color: C.ink3 }}>
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M4 5h16v11H4zM8 20h8M12 16v4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="mt-4">{isAr ? 'لا توجد كورسات بعد' : 'No courses yet'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const thumb = getMediaUrl(course.thumbnail)
              return (
                <Link
                  key={course.id}
                  href={`/${locale}/courses/${course.id}`}
                  className="block border rounded-2xl p-3 shadow-sm transition-colors hover:border-[color:var(--brand)]"
                  style={{ background: C.surface, borderColor: C.line }}
                >
                  <div className="aspect-video rounded-xl overflow-hidden" style={{ background: C.surface2 }}>
                    {thumb && <img src={thumb} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <h3 className="font-semibold line-clamp-2 mt-3" style={{ color: C.ink }}>{getCourseTitle(course, locale)}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span style={{ color: C.accent }}>{formatPrice(course.price, course.currency, isAr)}</span>
                    <span className="text-sm" style={{ color: C.ink2 }}>
                      {course._count?.enrollments ?? 0} {isAr ? 'طالب' : 'students'}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="border rounded-2xl p-5 text-center min-w-[120px] shadow-sm" style={{ background: C.surface, borderColor: C.line }}>
      <div className="text-2xl font-bold" style={{ color: C.ink }}>{value}</div>
      <div className="text-sm mt-1" style={{ color: C.ink2 }}>{label}</div>
    </div>
  )
}
