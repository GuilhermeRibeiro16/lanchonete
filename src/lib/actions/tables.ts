'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getTables() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('tables')
    .select('*')
    .order('number')

  if (error) throw new Error(error.message)
  return data
}

export async function createTable(number: number) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('tables')
    .insert({ number, active: true })
    .select()
    .single()

  if (error) throw new Error(error.message)
  revalidatePath('/admin/settings')
  return data
}

export async function deleteTable(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('tables')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/settings')
}

export async function toggleTable(id: string, active: boolean) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('tables')
    .update({ active })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/settings')
}