'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getSettings() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('settings')
    .select('*')

  if (error) throw new Error(error.message)

  return Object.fromEntries(data.map(s => [s.key, s.value ?? '']))
}

export async function updateSetting(key: string, value: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('settings')
    .update({ value })
    .eq('key', key)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/settings')
  revalidatePath('/admin/orders')
}

export async function updateSettings(data: Record<string, string>) {
  const supabase = createAdminClient()

  for (const [key, value] of Object.entries(data)) {
    const { error } = await supabase
      .from('settings')
      .update({ value })
      .eq('key', key)

    if (error) throw new Error(error.message)
  }

  revalidatePath('/admin/settings')
  revalidatePath('/admin/orders')
}