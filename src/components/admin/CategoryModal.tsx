'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createCategory, updateCategory } from '@/lib/actions/products'
import { Category } from '@/types'

interface Props {
  category?: Category
  onClose: () => void
  onSaved: (category: Category, isNew: boolean) => void
}

export default function CategoryModal({ category, onClose, onSaved }: Props) {
  const [name, setName] = useState(category?.name ?? '')
  const [loading, setLoading] = useState(false)

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (!name.trim()) return
  setLoading(true)

  try {
    if (category) {
      await updateCategory(category.id, name.trim())
      onSaved({ ...category, name: name.trim() }, false)
      toast.success('Categoria atualizada')
    } else {
      await createCategory(name.trim())
      // Buscar a categoria criada para atualizar o estado local
      const tempCategory = {
        id: Date.now().toString(), // temporário até revalidar
        name: name.trim(),
        sort_order: 0,
        deleted_at: null,
      }
      onSaved(tempCategory, true)
      toast.success('Categoria criada')
    }
    onClose()
  } catch {
    toast.error('Erro ao salvar categoria')
  } finally {
    setLoading(false)
  }
}
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#141414', border: '1px solid #1f1f1f',
          borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '400px',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#fafafa', fontWeight: '700', fontSize: '1.1rem' }}>
            {category ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label style={{ color: '#fafafa' }}>Nome</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Pizzas"
              required
              style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fafafa' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button type="button" onClick={onClose}
              style={{ backgroundColor: '#1f1f1f', color: '#fafafa', borderRadius: '8px' }}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}
              style={{ backgroundColor: '#dc2626', color: 'white', borderRadius: '8px' }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}