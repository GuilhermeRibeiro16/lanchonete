'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ClipboardList,
  History,
  LayoutDashboard,
  Package,
  Settings,
  LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const navItems = [
  { href: '/admin/orders', label: 'Pedidos', icon: ClipboardList },
  { href: '/admin/history', label: 'Histórico', icon: History },
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Produtos', icon: Package },
  { href: '/admin/settings', label: 'Config', icon: Settings },
]

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('Até logo!')
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <>
      <style>{`
        .admin-topbar { display: flex; }
        .admin-bottombar { display: none; }
        @media (max-width: 768px) {
          .admin-topbar { display: none; }
          .admin-bottombar { display: flex; }
        }
      `}</style>

      {/* TOP BAR — desktop */}
      <header
        className="admin-topbar"
        style={{
          backgroundColor: '#141414',
          borderBottom: '1px solid #1f1f1f',
          padding: '0 1.5rem',
          height: '60px',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '32px', height: '32px', backgroundColor: '#dc2626',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ClipboardList size={18} color="white" />
          </div>
          <span style={{ color: '#fafafa', fontWeight: '700', fontSize: '1rem' }}>
            Lanchonete
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.4rem 0.75rem', borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: active ? '600' : '400',
                color: active ? '#dc2626' : '#a1a1aa',
                backgroundColor: active ? '#1f1f1f' : 'transparent',
                textDecoration: 'none', transition: 'all 0.15s',
              }}>
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}

          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.4rem 0.75rem', borderRadius: '8px',
            fontSize: '0.875rem', color: '#a1a1aa',
            backgroundColor: 'transparent', border: 'none',
            cursor: 'pointer', marginLeft: '0.5rem',
          }}>
            <LogOut size={16} />
            Sair
          </button>
        </nav>
      </header>

      {/* BOTTOM BAR — mobile */}
      <nav
        className="admin-bottombar"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          backgroundColor: '#141414',
          borderTop: '1px solid #1f1f1f',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0.5rem 0',
          zIndex: 50,
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '0.2rem', padding: '0.4rem 0.75rem', borderRadius: '8px',
              textDecoration: 'none',
              color: active ? '#dc2626' : '#a1a1aa',
            }}>
              <Icon size={20} />
              <span style={{ fontSize: '0.65rem', fontWeight: active ? '600' : '400' }}>
                {item.label}
              </span>
            </Link>
          )
        })}

        <button onClick={handleLogout} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '0.2rem', padding: '0.4rem 0.75rem', borderRadius: '8px',
          color: '#a1a1aa', backgroundColor: 'transparent',
          border: 'none', cursor: 'pointer',
        }}>
          <LogOut size={20} />
          <span style={{ fontSize: '0.65rem' }}>Sair</span>
        </button>
      </nav>
    </>
  )
}