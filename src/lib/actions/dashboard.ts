'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getDashboardData(period: 'day' | 'week' | 'month' | 'year') {
  const supabase = createAdminClient()

  // Calcular range de datas no fuso Brasília
  const now = new Date()
  const brasiliaOffset = -3 * 60
  const brasiliaTime = new Date(now.getTime() + (brasiliaOffset - now.getTimezoneOffset()) * 60000)
  const today = brasiliaTime.toISOString().split('T')[0]

  let startDate: string
  let endDate = `${today}T23:59:59-03:00`

  if (period === 'day') {
    startDate = `${today}T00:00:00-03:00`
  } else if (period === 'week') {
    const d = new Date(brasiliaTime)
    d.setDate(d.getDate() - 6)
    startDate = `${d.toISOString().split('T')[0]}T00:00:00-03:00`
  } else if (period === 'month') {
    const d = new Date(brasiliaTime)
    d.setDate(1)
    startDate = `${d.toISOString().split('T')[0]}T00:00:00-03:00`
  } else {
    const d = new Date(brasiliaTime)
    d.setMonth(0, 1)
    startDate = `${d.toISOString().split('T')[0]}T00:00:00-03:00`
  }

  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        product_name,
        quantity,
        unit_price,
        order_item_options(option_price)
      )
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .neq('status', 'cancelled')

  if (error) throw new Error(error.message)

  // Métricas gerais
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
  const totalOrders = orders.length
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Produtos mais vendidos
  const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {}
  orders.forEach(order => {
    order.order_items?.forEach((item: any) => {
      if (!productMap[item.product_name]) {
        productMap[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 }
      }
      productMap[item.product_name].quantity += item.quantity
      productMap[item.product_name].revenue += item.unit_price * item.quantity
    })
  })
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8)

  // Origem dos pedidos
  const adminOrders = orders.filter(o => o.origin === 'admin').length
  const customerOrders = orders.filter(o => o.origin === 'customer').length

  // Gráfico — por hora (day) ou por dia (outros)
  let chartData: { label: string; revenue: number; orders: number }[] = []

  if (period === 'day') {
    // Agrupar por hora
    const hourMap: Record<number, { revenue: number; orders: number }> = {}
    for (let h = 0; h < 24; h++) hourMap[h] = { revenue: 0, orders: 0 }

    orders.forEach(order => {
      const date = new Date(order.created_at)
      // Converter para Brasília
      const brasiliaDate = new Date(date.getTime() - 3 * 60 * 60 * 1000)
      const hour = brasiliaDate.getUTCHours()
      hourMap[hour].revenue += order.total
      hourMap[hour].orders += 1
    })

    chartData = Object.entries(hourMap)
      .filter(([h]) => parseInt(h) >= 10 && parseInt(h) <= 23)
      .map(([h, v]) => ({
        label: `${h.padStart(2, '0')}h`,
        ...v,
      }))
  } else {
    // Agrupar por dia
    const dayMap: Record<string, { revenue: number; orders: number }> = {}

    orders.forEach(order => {
      const date = new Date(order.created_at)
      const brasiliaDate = new Date(date.getTime() - 3 * 60 * 60 * 1000)
      const day = brasiliaDate.toISOString().split('T')[0]
      if (!dayMap[day]) dayMap[day] = { revenue: 0, orders: 0 }
      dayMap[day].revenue += order.total
      dayMap[day].orders += 1
    })

    chartData = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, v]) => ({
        label: day.slice(5).replace('-', '/'),
        ...v,
      }))
  }

  // Horários de pico (top 3 horas com mais pedidos)
  const hourCount: Record<number, number> = {}
  orders.forEach(order => {
    const date = new Date(order.created_at)
    const brasiliaDate = new Date(date.getTime() - 3 * 60 * 60 * 1000)
    const hour = brasiliaDate.getUTCHours()
    hourCount[hour] = (hourCount[hour] ?? 0) + 1
  })
  const peakHours = Object.entries(hourCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([h, count]) => ({ hour: `${h.padStart(2, '0')}h`, count }))

  return {
    totalRevenue,
    totalOrders,
    deliveredOrders,
    avgTicket,
    topProducts,
    chartData,
    peakHours,
    adminOrders,
    customerOrders,
  }
}