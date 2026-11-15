import { notFound } from 'next/navigation'

const API_BASE = (() => {
  const env = (process.env.NEXT_PUBLIC_API_URL || 'https://api.deveways.com').replace(/\/+$/, '')
  return env.endsWith('/api') ? env : `${env}/api`
})()

// Return a real HTTP 404 for course ids that do not exist. Only an explicit 404 from the API
// triggers it; network errors or other statuses fall through to the normal client-side page.
export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  try {
    const res = await fetch(`${API_BASE}/courses/${encodeURIComponent(params.id)}`, {
      next: { revalidate: 60 },
    })
    if (res.status === 404) notFound()
  } catch (err) {
    // notFound() throws a special error that must propagate
    if (err && typeof err === 'object' && 'digest' in err) throw err
  }
  return children
}
