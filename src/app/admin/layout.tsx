import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminNav from '@/components/admin/AdminNav'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/admin/login')

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
      <AdminNav />
      <main style={{ paddingBottom: '5rem' }}>
        {children}
      </main>
    </div>
  )
}

