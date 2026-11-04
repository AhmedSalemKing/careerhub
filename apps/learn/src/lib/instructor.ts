// Courses created from the admin account are owned by the platform, so the
// instructor shown to students is the brand rather than the "admin" account.
// The courses API exposes only instructor.profile.{firstName,lastName}, so the
// account is recognised by name, or by role when an endpoint provides one.
export const PLATFORM_INSTRUCTOR_NAME = 'DeveWay'

type InstructorLike = {
  role?: string | null
  profile?: { firstName?: string | null; lastName?: string | null } | null
} | null | undefined

export function isPlatformInstructor(instructor: InstructorLike): boolean {
  if (!instructor) return false
  const role = String(instructor.role ?? '').toUpperCase()
  if (role === 'ADMIN' || role === 'SUPER_ADMIN') return true
  const first = (instructor.profile?.firstName ?? '').trim().toLowerCase()
  const last = (instructor.profile?.lastName ?? '').trim().toLowerCase()
  return `${first} ${last}`.trim() === 'admin'
}

/** Full instructor name for display; `fallback` is used when there is no profile. */
export function instructorDisplayName(instructor: InstructorLike, fallback: string): string {
  if (isPlatformInstructor(instructor)) return PLATFORM_INSTRUCTOR_NAME
  const p = instructor?.profile
  if (!p) return fallback
  return `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || fallback
}
