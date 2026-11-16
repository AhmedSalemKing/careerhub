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
  const chip = 'bg-purple-900/40 border border-purple-500/30 text-purple-300 rounded-full px-3 py-1 text-sm'

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className={`min-h-screen bg-[#0D0A1F] ${align}`}>
      <section className="bg-gradient-to-b from-[#1A0E3F] to-[#0D0A1F] py-16">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row gap-6 items-start">
          <UserAvatar
            user={{ photo: instructor.profile?.avatar, gender: instructor.profile?.gender, name }}
            size={96}
            className="ring-4 ring-purple-500/30"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-white">{name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={chip}>{isAr ? 'محاضر' : 'Instructor'}</span>
              {instructor.profile?.speciality && <span className={chip}>{instructor.profile.speciality}</span>}
              {joined && (
                <span className="text-sm text-gray-400">
                  {isAr ? 'انضم في' : 'Joined'} {joined}
                </span>
              )}
            </div>
            {instructor.profile?.bio && (
              <p className="text-gray-300 leading-relaxed max-w-2xl mt-4">{instructor.profile.bio}</p>
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
          <h2 className="text-2xl font-bold text-white">{isAr ? 'الكورسات' : 'Courses'}</h2>
          <span className={chip}>{courses.length}</span>
        </div>

        {courses.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
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
                  className="block bg-white/5 border border-white/10 rounded-2xl p-3 hover:border-purple-500/40 transition-colors"
                >
                  <div className="aspect-video bg-white/5 rounded-xl overflow-hidden">
                    {thumb && <img src={thumb} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <h3 className="font-semibold text-white line-clamp-2 mt-3">{getCourseTitle(course, locale)}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-purple-400">{formatPrice(course.price, course.currency, isAr)}</span>
                    <span className="text-gray-400 text-sm">
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
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center min-w-[120px]">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  )
}
