import { VerifyCertificatePage } from './VerifyCertificatePage'

export async function generateMetadata({ params }: { params: { serial: string; locale: string } }) {
  const isAr = params.locale === 'ar'
  return {
    title: isAr ? 'التحقق من الشهادة | DeveWay' : 'Certificate Verification | DeveWay',
    description: isAr
      ? `التحقق من صحة شهادة DeveWay. الرقم التسلسلي: ${params.serial}`
      : `Verify the authenticity of a DeveWay certificate. Serial: ${params.serial}`,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://www.deveways.com/${params.locale}/verify/${params.serial}`,
    },
  }
}

export default function Page() {
  return <VerifyCertificatePage />
}
