import { getTodayOrders } from '@/lib/actions/orders'
import { getProducts, getCategories } from '@/lib/actions/products'
import { getSettings } from '@/lib/actions/settings'
import OrdersClient from '@/components/admin/OrdersClient'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const [orders, products, categories, settings] = await Promise.all([
    getTodayOrders(),
    getProducts(),
    getCategories(),
    getSettings(),
  ])

  return (
    <OrdersClient
      initialOrders={orders}
      products={products}
      categories={categories}
      settings={settings}
    />
  )
}