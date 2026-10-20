import ManageCoursePage from '../../../../dashboard/courses/[id]/manage/page'

// Admin course content management.
// Reuses the instructor manage page component as-is (sections, lessons,
// uploads, students, settings) — the API now allows ADMIN / SUPER_ADMIN
// on the instructor content endpoints. Route access is enforced by the
// admin layout auth guard.
export default async function AdminManageCoursePage({
  params,
}: {
  params:
    | { id?: string; courseId?: string }
    | Promise<{ id?: string; courseId?: string }>
}) {
  const resolved = await params
  const courseId = resolved.id ?? resolved.courseId

  return <ManageCoursePage key={courseId} />
}
