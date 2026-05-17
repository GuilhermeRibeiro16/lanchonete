'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getPublicMenu() {
  const supabase = createAdminClient()

  const [categoriesRes, productsRes, settingsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .is('deleted_at', null)
      .order('sort_order'),
    supabase
      .from('products')
      .select(`
        *,
        category:categories(*),
        option_groups:product_option_groups(
          *,
          options:product_options(
            *
          )
        )
      `)
      .is('deleted_at', null)
      .eq('available', true)
      .order('sort_order'),
    supabase
      .from('settings')
      .select('key, value'),
  ])

  const settings = Object.fromEntries(
    settingsRes.data?.map(s => [s.key, s.value ?? '']) ?? []
  )

  return {
    categories: categoriesRes.data ?? [],
    products: productsRes.data ?? [],
    settings,
  }
}