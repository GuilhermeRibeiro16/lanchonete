'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, UtensilsCrossed } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Email ou senha incorretos')
      setLoading(false)
      return
    }

    router.push('/admin/orders')
    router.refresh()
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#141414',
          border: '1px solid #1f1f1f',
          borderRadius: '12px',
          padding: '2rem',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '2rem',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#dc2626',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UtensilsCrossed size={28} color="white" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#fafafa',
              }}
            >
              Painel Admin
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#a1a1aa', marginTop: '2px' }}>
              Acesso restrito à equipe
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="email" style={{ color: '#fafafa', fontSize: '0.875rem' }}>
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #1f1f1f',
                color: '#fafafa',
                borderRadius: '8px',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label htmlFor="password" style={{ color: '#fafafa', fontSize: '0.875rem' }}>
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #1f1f1f',
                color: '#fafafa',
                borderRadius: '8px',
              }}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              borderRadius: '8px',
              height: '44px',
              fontSize: '0.9rem',
              fontWeight: '600',
              marginTop: '0.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Loader2 size={16} className="animate-spin" />
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}