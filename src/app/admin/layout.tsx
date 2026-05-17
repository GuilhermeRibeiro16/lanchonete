import AdminNav from '@/components/admin/AdminNav'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a' }}>
      <AdminNav />
      <main style={{ paddingBottom: '5rem' }}>
        {children}
      </main>
    </div>
  )
}