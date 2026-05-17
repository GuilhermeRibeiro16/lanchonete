import { getProducts, getCategories } from '@/lib/actions/products'
import ProductsClient from '@/components/admin/ProductsClient'

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ])

  return <ProductsClient products={products} categories={categories} />
}