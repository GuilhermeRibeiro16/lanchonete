import { getDashboardData } from '@/lib/actions/dashboard'
import DashboardClient from '@/components/admin/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const data = await getDashboardData('day')
  return <DashboardClient initialData={data} initialPeriod="day" />
}