import { getOrdersByDate } from '@/lib/actions/orders'
import HistoryClient from '@/components/admin/HistoryClient'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  // Data de hoje no fuso Brasília
  const now = new Date()
  const brasiliaOffset = -3 * 60
  const brasiliaTime = new Date(now.getTime() + (brasiliaOffset - now.getTimezoneOffset()) * 60000)
  const today = brasiliaTime.toISOString().split('T')[0]

  const orders = await getOrdersByDate(today)

  return <HistoryClient initialOrders={orders} initialDate={today} />
}