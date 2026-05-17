'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  X, Loader2, Upload, Plus, Trash2, ChevronDown, ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'
import {
  createProduct, updateProduct, uploadProductImage,
  deleteProductImage, createOptionGroup, updateOptionGroup,
  deleteOptionGroup, createOption, updateOption, deleteOption
} from '@/lib/actions/products'
import { Product, Category, ProductOptionGroup, ProductOption } from '@/types'

interface Props {
  product?: Product
  categories: Category[]
  onClose: () => void
  onSaved: (product: Product, isNew: boolean) => void
}

export default function ProductModal({ product, categories, onClose, onSaved }: Props) {
  const isNew = !product
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product?.price?.toString() ?? '')
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '')
  const [available, setAvailable] = useState(product?.available ?? true)
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? null)
  const [imageLoading, setImageLoading] = useState(false)
  const [loading, setLoading] = useState(false)

  // Grupos de opções
  const [groups, setGroups] = useState<ProductOptionGroup[]>(product?.option_groups ?? [])
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)

  // Novo grupo form
  const [newGroup, setNewGroup] = useState({ name: '', type: 'radio' as 'radio' | 'checkbox', required: false, min_select: 0, max_select: 1, included_count: 0 })
  const [addingGroup, setAddingGroup] = useState(false)
  const [savingGroup, setSavingGroup] = useState(false)

  // Nova opção por grupo
  const [newOption, setNewOption] = useState<Record<string, { name: string; price: string }>>({})
  const [savingOption, setSavingOption] = useState<string | null>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageLoading(true)
    try {
      if (imageUrl) await deleteProductImage(imageUrl)
      const url = await uploadProductImage(file)
      setImageUrl(url)
      toast.success('Imagem enviada')
    } catch {
      toast.error('Erro ao enviar imagem')
    } finally {
      setImageLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !price || !categoryId) {
      toast.error('Preencha nome, preço e categoria')
      return
    }
    setLoading(true)

    const formData = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price.replace(',', '.')),
      category_id: categoryId,
      available,
      image_url: imageUrl,
    }

    try {
      if (isNew) {
        const saved = await createProduct(formData)
        onSaved({ ...saved, option_groups: [] }, true)
        toast.success('Produto criado')
      } else {
        await updateProduct(product.id, formData)
        onSaved({ ...product, ...formData, option_groups: groups }, false)
        toast.success('Produto atualizado')
      }
      onClose()
    } catch {
      toast.error('Erro ao salvar produto')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddGroup() {
    if (!product?.id) {
      toast.error('Salve o produto primeiro para adicionar opções')
      return
    }
    if (!newGroup.name.trim()) return
    setSavingGroup(true)
    try {
      const saved = await createOptionGroup({ ...newGroup, product_id: product.id })
      setGroups(prev => [...prev, { ...saved, options: [] }])
      setNewGroup({ name: '', type: 'radio', required: false, min_select: 0, max_select: 1, included_count: 0 })
      setAddingGroup(false)
      toast.success('Grupo criado')
    } catch {
      toast.error('Erro ao criar grupo')
    } finally {
      setSavingGroup(false)
    }
  }

  async function handleDeleteGroup(groupId: string) {
    if (!confirm('Deletar grupo e todas as opções?')) return
    try {
      await deleteOptionGroup(groupId)
      setGroups(prev => prev.filter(g => g.id !== groupId))
      toast.success('Grupo deletado')
    } catch {
      toast.error('Erro ao deletar grupo')
    }
  }

  async function handleAddOption(groupId: string) {
    const opt = newOption[groupId]
    if (!opt?.name?.trim()) return
    setSavingOption(groupId)
    try {
      await createOption({
        group_id: groupId,
        name: opt.name.trim(),
        price: parseFloat((opt.price || '0').replace(',', '.')),
        available: true,
      })
      setGroups(prev => prev.map(g => g.id === groupId ? {
        ...g,
        options: [...(g.options ?? []), {
          id: Date.now().toString(),
          group_id: groupId,
          name: opt.name.trim(),
          price: parseFloat((opt.price || '0').replace(',', '.')),
          available: true,
          sort_order: 0,
        }]
      } : g))
      setNewOption(prev => ({ ...prev, [groupId]: { name: '', price: '' } }))
      toast.success('Opção adicionada')
    } catch {
      toast.error('Erro ao adicionar opção')
    } finally {
      setSavingOption(null)
    }
  }

  async function handleDeleteOption(groupId: string, optionId: string) {
    try {
      await deleteOption(optionId)
      setGroups(prev => prev.map(g => g.id === groupId ? {
        ...g,
        options: (g.options ?? []).filter(o => o.id !== optionId)
      } : g))
      toast.success('Opção removida')
    } catch {
      toast.error('Erro ao remover opção')
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '1.5rem', width: '100%', maxWidth: '560px', marginTop: '2rem', marginBottom: '2rem' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#fafafa', fontWeight: '700', fontSize: '1.1rem' }}>
            {isNew ? 'Novo Produto' : 'Editar Produto'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Imagem */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label style={{ color: '#fafafa' }}>Foto do produto</Label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%', height: '140px', borderRadius: '8px',
                border: '2px dashed #1f1f1f', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', position: 'relative', backgroundColor: '#0a0a0a',
              }}
            >
              {imageLoading ? (
                <Loader2 size={24} className="animate-spin" color="#dc2626" />
              ) : imageUrl ? (
                <img src={imageUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: '#3f3f3f' }}>
                  <Upload size={24} />
                  <span style={{ fontSize: '0.8rem' }}>Clique para enviar</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
          </div>

          {/* Nome */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label style={{ color: '#fafafa' }}>Nome *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Pizza Calabresa" required
              style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fafafa' }} />
          </div>

          {/* Descrição */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Label style={{ color: '#fafafa' }}>Descrição</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Ingredientes, detalhes..."
              style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fafafa', resize: 'none', rows: 2 } as React.CSSProperties} />
          </div>

          {/* Preço + Categoria */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Label style={{ color: '#fafafa' }}>Preço *</Label>
              <Input value={price} onChange={e => setPrice(e.target.value)} placeholder="0,00" required
                style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fafafa' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Label style={{ color: '#fafafa' }}>Categoria *</Label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                required
                style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', color: categoryId ? '#fafafa' : '#3f3f3f', borderRadius: '6px', padding: '0.5rem', fontSize: '0.875rem' }}
              >
                <option value="">Selecionar...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Disponível */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="checkbox"
              id="available"
              checked={available}
              onChange={e => setAvailable(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#dc2626' }}
            />
            <Label htmlFor="available" style={{ color: '#fafafa', cursor: 'pointer' }}>Disponível no cardápio</Label>
          </div>

          {/* Botão salvar produto */}
          <Button type="submit" disabled={loading}
            style={{ backgroundColor: '#dc2626', color: 'white', borderRadius: '8px', height: '44px', fontWeight: '600' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : isNew ? 'Criar Produto' : 'Salvar Alterações'}
          </Button>
        </form>

        {/* GRUPOS DE OPÇÕES — só aparece se produto já existe */}
        {!isNew && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid #1f1f1f', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: '#fafafa', fontWeight: '600', fontSize: '0.95rem' }}>Grupos de Opções</h3>
              <button
                onClick={() => setAddingGroup(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}
              >
                <Plus size={14} /> Novo Grupo
              </button>
            </div>

            {/* Form novo grupo */}
            {addingGroup && (
              <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Input value={newGroup.name} onChange={e => setNewGroup(p => ({ ...p, name: e.target.value }))} placeholder="Nome do grupo (ex: Bordas)" style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', color: '#fafafa' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <select value={newGroup.type} onChange={e => setNewGroup(p => ({ ...p, type: e.target.value as 'radio' | 'checkbox' }))}
                    style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', color: '#fafafa', borderRadius: '6px', padding: '0.5rem', fontSize: '0.875rem' }}>
                    <option value="radio">Radio (única escolha)</option>
                    <option value="checkbox">Checkbox (múltipla)</option>
                  </select>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" id="req" checked={newGroup.required} onChange={e => setNewGroup(p => ({ ...p, required: e.target.checked }))} style={{ accentColor: '#dc2626' }} />
                    <label htmlFor="req" style={{ color: '#fafafa', fontSize: '0.875rem', cursor: 'pointer' }}>Obrigatório</label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <Button onClick={() => setAddingGroup(false)} style={{ backgroundColor: '#1f1f1f', color: '#fafafa', borderRadius: '6px', height: '36px', fontSize: '0.8rem' }}>Cancelar</Button>
                  <Button onClick={handleAddGroup} disabled={savingGroup} style={{ backgroundColor: '#dc2626', color: 'white', borderRadius: '6px', height: '36px', fontSize: '0.8rem' }}>
                    {savingGroup ? <Loader2 size={14} className="animate-spin" /> : 'Criar'}
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de grupos */}
            {groups.map(group => (
              <div key={group.id} style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '8px', marginBottom: '0.75rem', overflow: 'hidden' }}>
                {/* Header do grupo */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', cursor: 'pointer' }}
                  onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#fafafa', fontWeight: '600', fontSize: '0.875rem' }}>{group.name}</span>
                    <Badge style={{ backgroundColor: '#1f1f1f', color: '#a1a1aa', fontSize: '0.65rem' }}>
                      {group.type === 'radio' ? 'Única' : 'Múltipla'}
                    </Badge>
                    {group.required && <Badge style={{ backgroundColor: '#7f1d1d', color: 'white', fontSize: '0.65rem' }}>Obrigatório</Badge>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button onClick={e => { e.stopPropagation(); handleDeleteGroup(group.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '2px' }}>
                      <Trash2 size={14} />
                    </button>
                    {expandedGroup === group.id ? <ChevronUp size={16} color="#a1a1aa" /> : <ChevronDown size={16} color="#a1a1aa" />}
                  </div>
                </div>

                {/* Opções do grupo */}
                {expandedGroup === group.id && (
                  <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(group.options ?? []).map(option => (
                      <div key={option.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#141414', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
                        <span style={{ color: '#fafafa', fontSize: '0.875rem' }}>{option.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ color: '#dc2626', fontSize: '0.875rem', fontWeight: '600' }}>
                            {option.price > 0 ? `+R$ ${option.price.toFixed(2).replace('.', ',')}` : 'Grátis'}
                          </span>
                          <button onClick={() => handleDeleteOption(group.id, option.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3f3f3f' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Adicionar opção */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <Input
                        placeholder="Nome da opção"
                        value={newOption[group.id]?.name ?? ''}
                        onChange={e => setNewOption(prev => ({ ...prev, [group.id]: { ...prev[group.id], name: e.target.value } }))}
                        style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', color: '#fafafa', fontSize: '0.8rem', height: '36px' }}
                      />
                      <Input
                        placeholder="Preço"
                        value={newOption[group.id]?.price ?? ''}
                        onChange={e => setNewOption(prev => ({ ...prev, [group.id]: { ...prev[group.id], price: e.target.value } }))}
                        style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', color: '#fafafa', fontSize: '0.8rem', height: '36px', width: '80px' }}
                      />
                      <Button onClick={() => handleAddOption(group.id)} disabled={savingOption === group.id}
                        style={{ backgroundColor: '#dc2626', color: 'white', borderRadius: '6px', height: '36px', padding: '0 0.75rem' }}>
                        {savingOption === group.id ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}