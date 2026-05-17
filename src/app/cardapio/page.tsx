import { getPublicMenu } from '@/lib/actions/public'
import CardapioClient from '@/components/cardapio/CardapioClient'

export const dynamic = 'force-dynamic'

export default async function CardapioPage({
  searchParams,
}: {
  searchParams: Promise<{ mesa?: string }>
}) {
  const { mesa } = await searchParams
  const { categories, products, settings } = await getPublicMenu()

  return (
    <CardapioClient
      categories={categories}
      products={products}
      settings={settings}
      tableNumber={mesa ?? null}
    />
  )
}