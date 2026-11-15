import { redirect } from 'next/navigation'

export default function CareerPathPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/dashboard`)
}
