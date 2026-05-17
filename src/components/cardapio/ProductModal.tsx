'use client'

import { useState } from 'react'
import { Product, ProductOptionGroup, CartItem } from '@/types'
import { X, Plus, Minus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Props {
  product: Product
  onClose: () => void
  onAddToCart: (item: CartItem) => void
}

export default function ProductModal({ product, onClose, onAddToCart }: Props) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({})
  const [splitWith, setSplitWith] = useState('')
  const [notes, setNotes] = useState('')
  const [quantity, setQuantity] = useState(1)

  const isPizza = product.category?.name?.toLowerCase().includes('pizza')

  function handleOptionSelect(group: ProductOptionGroup, optionId: string) {
    setSelectedOptions(prev => {
      const current = prev[group.id] ?? []
      if (group.type === 'radio') {
        return { ...prev, [group.id]: [optionId] }
      } else {
        if (current.includes(optionId)) {
          return { ...prev, [group.id]: current.filter(id => id !== optionId) }
        }
        if (group.max_select && current.length >= group.max_select) {
          toast.error(`Máximo ${group.max_select} opções`)
          return prev
        }
        return { ...prev, [group.id]: [...current, optionId] }
      }
    })
  }

  function calcTotal() {
    let optionsPrice = 0
    Object.entries(selectedOptions).forEach(([groupId, optIds]) => {
      const group = product.option_groups?.find(g => g.id === groupId)
      if (!group) return
      optIds.forEach(optId => {
        const opt = group.options?.find(o => o.id === optId)
        if (opt) optionsPrice += opt.price
      })
    })
    return (product.price + optionsPrice) * quantity
  }

  function handleAdd() {
    // Validar grupos obrigatórios
    const requiredGroups = product.option_groups?.filter(g => g.required) ?? []
    for (const group of requiredGroups) {
      if (!selectedOptions[group.id]?.length) {
        toast.error(`Selecione uma opção em: ${group.name}`)
        return
      }
    }

    const itemTotal = calcTotal()

    const cartItem: CartItem = {
      product,
      quantity,
      selectedOptions: Object.entries(selectedOptions).flatMap(([groupId, optIds]) => {
        const group = product.option_groups?.find(g => g.id === groupId)
        return optIds.map(optId => {
          const opt = group?.options?.find(o => o.id === optId)
          return {
            group_id: groupId,
            group_name: group?.name ?? '',
            option_id: optId,
            option_name: opt?.name ?? '',
            option_price: opt?.price ?? 0,
          }
        })
      }),
      split_with: splitWith || null,
      notes: notes || null,
      itemTotal,
    }

    onAddToCart(cartItem)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: '#141414', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Imagem */}
        {product.image_url ? (
          <div style={{ position: 'relative', height: '200px' }}>
            <img src={product.image_url} alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px 16px 0 0' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(20,20,20,0.8), transparent)', borderRadius: '16px 16px 0 0' }} />
            <button onClick={onClose}
              style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>
              <X size={16} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
            <button onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa' }}>
              <X size={20} />
            </button>
          </div>
        )}

        <div style={{ padding: '1.25rem' }}>
          {/* Info do produto */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ color: '#fafafa', fontSize: '1.25rem', fontWeight: '700', marginBottom: '4px' }}>
              {product.name}
            </h2>
            {product.description && (
              <p style={{ color: '#a1a1aa', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '8px' }}>
                {product.description}
              </p>
            )}
            <p style={{ color: '#dc2626', fontSize: '1.25rem', fontWeight: '700' }}>
              R$ {product.price.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {/* Grupos de opções */}
          {product.option_groups?.map(group => (
            <div key={group.id} style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', backgroundColor: '#0a0a0a', borderRadius: '8px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#fafafa', fontWeight: '600', fontSize: '0.9rem' }}>{group.name}</p>
                  <p style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>
                    {group.type === 'radio' ? 'Escolha 1 opção' : `Escolha até ${group.max_select}`}
                  </p>
                </div>
                {group.required && (
                  <Badge style={{ backgroundColor: '#dc2626', color: 'white', fontSize: '0.65rem' }}>
                    Obrigatório
                  </Badge>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {group.options?.filter(o => o.available).map(option => {
                  const selected = selectedOptions[group.id]?.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(group, option.id)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.75rem', borderRadius: '10px',
                        border: `1px solid ${selected ? '#dc2626' : '#1f1f1f'}`,
                        backgroundColor: selected ? '#1a0000' : '#0a0a0a',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '18px', height: '18px', borderRadius: group.type === 'radio' ? '50%' : '4px',
                          border: `2px solid ${selected ? '#dc2626' : '#3f3f3f'}`,
                          backgroundColor: selected ? '#dc2626' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {selected && <div style={{ width: '6px', height: '6px', backgroundColor: 'white', borderRadius: '50%' }} />}
                        </div>
                        <span style={{ color: selected ? '#fafafa' : '#a1a1aa', fontSize: '0.875rem' }}>
                          {option.name}
                        </span>
                      </div>
                      {option.price > 0 && (
                        <span style={{ color: '#dc2626', fontSize: '0.875rem', fontWeight: '600' }}>
                          +R$ {option.price.toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Meio a meio — só para pizzas */}
          {isPizza && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: '#0a0a0a', borderRadius: '8px', marginBottom: '0.75rem' }}>
                <p style={{ color: '#fafafa', fontWeight: '600', fontSize: '0.9rem' }}>Meio a meio</p>
                <p style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>Opcional — segundo sabor</p>
              </div>
              <input
                value={splitWith}
                onChange={e => setSplitWith(e.target.value)}
                placeholder={`Segundo sabor (metade com ${product.name})`}
                style={{
                  width: '100%', backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f',
                  color: '#fafafa', borderRadius: '10px', padding: '0.75rem',
                  fontSize: '0.875rem', outline: 'none',
                }}
              />
            </div>
          )}

          {/* Observação */}
          <div style={{ marginBottom: '1.25rem' }}>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Alguma observação? (sem cebola, ponto da carne...)"
              rows={2}
              style={{
                width: '100%', backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f',
                color: '#fafafa', borderRadius: '10px', padding: '0.75rem',
                fontSize: '0.875rem', outline: 'none', resize: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Quantidade + Adicionar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0', backgroundColor: '#0a0a0a', borderRadius: '10px', border: '1px solid #1f1f1f', overflow: 'hidden' }}>
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fafafa', padding: '0.75rem', fontSize: '1.1rem' }}
              >
                <Minus size={16} />
              </button>
              <span style={{ color: '#fafafa', fontWeight: '700', minWidth: '32px', textAlign: 'center', fontSize: '1rem' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fafafa', padding: '0.75rem', fontSize: '1.1rem' }}
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              onClick={handleAdd}
              style={{
                flex: 1, backgroundColor: '#dc2626', color: 'white',
                border: 'none', borderRadius: '10px', padding: '0.875rem',
                fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>Adicionar</span>
              <span>R$ {calcTotal().toFixed(2).replace('.', ',')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}