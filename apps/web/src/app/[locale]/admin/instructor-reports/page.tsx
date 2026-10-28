import { getCountry } from '../../../../lib/market'
import InstructorReportsClient from './InstructorReportsClient'

export default async function InstructorReportsPage() {
  const country = await getCountry()
  return <InstructorReportsClient country={country} />
}
