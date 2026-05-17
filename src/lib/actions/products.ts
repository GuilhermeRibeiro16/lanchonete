'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

// ================================================
// CATEGORIAS
// ================================================

export async function getCategories() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)
    .order('sort_order')

  if (error) throw new Error(error.message)
  return data
}

export async function createCategory(name: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('categories')
    .insert({ name })

  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}

export async function updateCategory(id: string, name: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}

export async function deleteCategory(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('categories')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}

// ================================================
// PRODUTOS
// ================================================

export async function getProducts() {
  const supabase = createAdminClient()
  


  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*),
      option_groups:product_option_groups(
        *,
        options:product_options(*)
      )
    `)
    .is('deleted_at', null)
    .order('sort_order')

  if (error) throw new Error(error.message)
  return data
}

export async function createProduct(formData: {
  name: string
  description: string
  price: number
  category_id: string
  available: boolean
  image_url: string | null
}) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('products')
    .insert(formData)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
  return data
}

export async function updateProduct(id: string, formData: {
  name?: string
  description?: string
  price?: number
  category_id?: string
  available?: boolean
  image_url?: string | null
}) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('products')
    .update(formData)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}

export async function deleteProduct(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}

export async function toggleProductAvailability(id: string, available: boolean) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('products')
    .update({ available })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}

// ================================================
// UPLOAD DE IMAGEM
// ================================================

export async function uploadProductImage(formData: FormData): Promise<string> {
  const supabase = createAdminClient()

  const file = formData.get('file') as File
  if (!file) throw new Error('Arquivo não encontrado')

  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const path = `products/${fileName}`

  const { error } = await supabase.storage
    .from('images')
    .upload(path, file, { upsert: false })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(path)

  return data.publicUrl
}

export async function deleteProductImage(url: string) {
  const supabase = createAdminClient()

  const path = url.split('/images/')[1]
  if (!path) return

  await supabase.storage.from('images').remove([path])
}

// ================================================
// GRUPOS DE OPÇÕES
// ================================================

export async function createOptionGroup(data: {
  product_id: string
  name: string
  type: 'radio' | 'checkbox'
  required: boolean
  min_select: number
  max_select: number
  included_count: number
}) {
  const supabase = createAdminClient()
  const { data: group, error } = await supabase
    .from('product_option_groups')
    .insert(data)
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
  return group
}

export async function updateOptionGroup(id: string, data: {
  name?: string
  type?: 'radio' | 'checkbox'
  required?: boolean
  min_select?: number
  max_select?: number
  included_count?: number
}) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('product_option_groups')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}

export async function deleteOptionGroup(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('product_option_groups')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}

// ================================================
// OPÇÕES
// ================================================

export async function createOption(data: {
  group_id: string
  name: string
  price: number
  available: boolean
}) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('product_options')
    .insert(data)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}

export async function updateOption(id: string, data: {
  name?: string
  price?: number
  available?: boolean
}) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('product_options')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}

export async function deleteOption(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('product_options')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
}