'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Minus, Trash2, Loader2, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { createOrder } from '@/lib/actions/orders'
import { Product, Category, Order, ProductOptionGroup } from '@/types'

interface CartItem {
  product: Product
  quantity: number
  selectedOptions: Record<string, string[]> // group_id -> option_ids[]
  split_with: string
  notes: string
  itemTotal: number
}

interface Props {
  products: Product[]
  categories: Category[]
  settings: Record<string, string>
  onClose: () => void
  onCreated: (order: Order) => void
}

export default function CreateOrderModal({ products, categories, settings, onClose, onCreated }: Props) {
  // Formulário
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState<'delivery' | 'pickup' | 'table'>('pickup')
  const [address, setAddress] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [useCard, setUseCard] = useState(false)

  // Carrinho
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Modal de opções do produto
  const [productModal, setProductModal] = useState<Product | null>(null)
  const [tempOptions, setTempOptions] = useState<Record<string, string[]>>({})
  const [tempSplitWith, setTempSplitWith] = useState('')
  const [tempNotes, setTempNotes] = useState('')
  const [tempQty, setTempQty] = useState(1)

  const [loading, setLoading] = useState(false)

  const deliveryFee = type === 'delivery' ? parseFloat(settings.delivery_fee ?? '2') : 0
  const cardFeePercent = useCard ? parseFloat(settings.card_fee_percent ?? '0') : 0

  const cartSubtotal = cart.reduce((sum, i) => sum + i.itemTotal, 0)
  const cardFeeAmount = useCard ? (cartSubtotal + deliveryFee) * (cardFeePercent / 100) : 0
  const cartTotal = cartSubtotal + deliveryFee + cardFeeAmount

  // Filtro de categorias
  const filteredProducts = products.filter(p => {
    if (!p.available) return false
    if (selectedCategory === 'all') return true
    return p.category_id === selectedCategory
  })

  // Calcular total do item com opções
  function calcItemTotal(product: Product, options: Record<string, string[]>, qty: number) {
    let optionsPrice = 0
    Object.values(options).flat().forEach(optId => {
      product.option_groups?.forEach(g => {
        const opt = g.options?.find(o => o.id === optId)
        if (opt) optionsPrice += opt.price
      })
    })
    return (product.price + optionsPrice) * qty
  }

  // Abrir modal de produto
  function openProductModal(product: Product) {
    setProductModal(product)
    setTempOptions({})
    setTempSplitWith('')
    setTempNotes('')
    setTempQty(1)
  }

  // Selecionar opção
  function handleOptionSelect(group: ProductOptionGroup, optionId: string) {
    setTempOptions(prev => {
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

  // Adicionar ao carrinho
  function handleAddToCart() {
    if (!productModal) return

    // Validar grupos obrigatórios
    const requiredGroups = productModal.option_groups?.filter(g => g.required) ?? []
    for (const group of requiredGroups) {
      if (!tempOptions[group.id]?.length) {
        toast.error(`Selecione uma opção em: ${group.name}`)
        return
      }
    }

    const itemTotal = calcItemTotal(productModal, tempOptions, tempQty)

    setCart(prev => [...prev, {
      product: productModal,
      quantity: tempQty,
      selectedOptions: tempOptions,
      split_with: tempSplitWith,
      notes: tempNotes,
      itemTotal,
    }])

    setProductModal(null)
    toast.success(`${productModal.name} adicionado`)
  }

  // Remover do carrinho
  function removeFromCart(index: number) {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  // Criar pedido
  async function handleSubmit() {
    if (!customerName.trim()) {
      toast.error('Informe o nome do cliente')
      return
    }
    if (cart.length === 0) {
      toast.error('Adicione pelo menos um produto')
      return
    }
    if (type === 'delivery' && !address.trim()) {
      toast.error('Informe o endereço de entrega')
      return
    }
    if (type === 'table' && !tableNumber.trim()) {
      toast.error('Informe o número da mesa')
      return
    }

    setLoading(true)
    try {
      const order = await createOrder({
        customer_name: customerName.trim(),
        phone: phone.trim() || null,
        type,
        address: type === 'delivery' ? address.trim() : null,
        table_number: type === 'table' ? tableNumber.trim() : null,
        notes: notes.trim() || null,
        card_fee: useCard ? cardFeePercent : null,
        origin: 'admin',
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          selected_option_ids: Object.values(item.selectedOptions).flat(),
          split_with: item.split_with || null,
          notes: item.notes || null,
        }))
      })

      onCreated(order as Order)
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao criar pedido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* MODAL PRINCIPAL */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}
        onClick={onClose}
      >
        <div
          style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: '12px', width: '100%', maxWidth: '640px', marginTop: '1rem', marginBottom: '2rem' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #1f1f1f' }}>
            <h2 style={{ color: '#fafafa', fontWeight: '700', fontSize: '1.1rem' }}>Novo Pedido</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Dados do cliente */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <Label style={{ color: '#fafafa', fontSize: '0.8rem' }}>Nome *</Label>
                <Input value={customerName} onChange={e => setCustomerName(e.target.value)}
                  placeholder="Nome do cliente"
                  style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fafafa', height: '38px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <Label style={{ color: '#fafafa', fontSize: '0.8rem' }}>Telefone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fafafa', height: '38px' }} />
              </div>
            </div>

            {/* Tipo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <Label style={{ color: '#fafafa', fontSize: '0.8rem' }}>Tipo *</Label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['pickup', 'delivery', 'table'] as const).map(t => (
                  <button key={t}
                    onClick={() => setType(t)}
                    style={{
                      flex: 1, padding: '0.5rem', borderRadius: '8px', border: '1px solid',
                      borderColor: type === t ? '#dc2626' : '#1f1f1f',
                      backgroundColor: type === t ? '#3f0000' : '#0a0a0a',
                      color: type === t ? '#fca5a5' : '#a1a1aa',
                      cursor: 'pointer', fontSize: '0.8rem', fontWeight: type === t ? '600' : '400',
                    }}>
                    {t === 'pickup' ? '🏪 Retirada' : t === 'delivery' ? '🚚 Entrega' : '🍽️ Mesa'}
                  </button>
                ))}
              </div>
            </div>

            {/* Endereço ou Mesa */}
            {type === 'delivery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <Label style={{ color: '#fafafa', fontSize: '0.8rem' }}>Endereço *</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="Rua, número, bairro"
                  style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fafafa', height: '38px' }} />
              </div>
            )}
            {type === 'table' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <Label style={{ color: '#fafafa', fontSize: '0.8rem' }}>Número da Mesa *</Label>
                <Input value={tableNumber} onChange={e => setTableNumber(e.target.value)}
                  placeholder="Ex: 3"
                  style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fafafa', height: '38px' }} />
              </div>
            )}

            {/* Produtos */}
            <div>
              <Label style={{ color: '#fafafa', fontSize: '0.8rem', marginBottom: '0.5rem', display: 'block' }}>Produtos</Label>

              {/* Filtro de categoria */}
              <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                <CategoryBtn label="Todos" active={selectedCategory === 'all'} onClick={() => setSelectedCategory('all')} />
                {categories.map(c => (
                  <CategoryBtn key={c.id} label={c.name} active={selectedCategory === c.id} onClick={() => setSelectedCategory(c.id)} />
                ))}
              </div>

              {/* Grid de produtos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem', maxHeight: '240px', overflowY: 'auto' }}>
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => openProductModal(product)}
                    style={{
                      backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '8px',
                      padding: '0.75rem 0.5rem', cursor: 'pointer', textAlign: 'left',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#dc2626')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#1f1f1f')}
                  >
                    {product.image_url && (
                      <img src={product.image_url} alt={product.name}
                        style={{ width: '100%', height: '60px', objectFit: 'cover', borderRadius: '6px', marginBottom: '0.4rem' }} />
                    )}
                    <p style={{ color: '#fafafa', fontSize: '0.8rem', fontWeight: '600', marginBottom: '2px' }}>{product.name}</p>
                    <p style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: '700' }}>
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Carrinho */}
            {cart.length > 0 && (
              <div style={{ backgroundColor: '#0a0a0a', borderRadius: '8px', padding: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <ShoppingCart size={14} color="#dc2626" />
                  <span style={{ color: '#fafafa', fontSize: '0.85rem', fontWeight: '600' }}>Carrinho</span>
                </div>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #1f1f1f' }}>
                    <div>
                      <p style={{ color: '#fafafa', fontSize: '0.8rem' }}>
                        {item.quantity}x {item.product.name}
                        {item.split_with && <span style={{ color: '#a1a1aa' }}> / {item.split_with}</span>}
                      </p>
                      {Object.values(item.selectedOptions).flat().map(optId => {
                        let optName = ''
                        item.product.option_groups?.forEach(g => {
                          const opt = g.options?.find(o => o.id === optId)
                          if (opt) optName = opt.name
                        })
                        return optName ? (
                          <p key={optId} style={{ color: '#a1a1aa', fontSize: '0.75rem', paddingLeft: '0.75rem' }}>+ {optName}</p>
                        ) : null
                      })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: '600' }}>
                        R$ {item.itemTotal.toFixed(2).replace('.', ',')}
                      </span>
                      <button onClick={() => removeFromCart(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3f3f3f' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Totais */}
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {deliveryFee > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '0.8rem' }}>
                      <span>Taxa entrega</span>
                      <span>R$ {deliveryFee.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  {cardFeeAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '0.8rem' }}>
                      <span>Taxa cartão ({cardFeePercent}%)</span>
                      <span>R$ {cardFeeAmount.toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fafafa', fontWeight: '700', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                    <span>Total</span>
                    <span style={{ color: '#dc2626' }}>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Taxa cartão */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input type="checkbox" id="card" checked={useCard} onChange={e => setUseCard(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#dc2626' }} />
              <Label htmlFor="card" style={{ color: '#fafafa', cursor: 'pointer', fontSize: '0.875rem' }}>
                Pagamento no cartão (+{cardFeePercent}%)
              </Label>
            </div>

            {/* Observação */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <Label style={{ color: '#fafafa', fontSize: '0.8rem' }}>Observação geral</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Observações do pedido..."
                style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fafafa', resize: 'none', minHeight: '70px' }} />
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Button onClick={onClose} style={{ flex: 1, backgroundColor: '#1f1f1f', color: '#fafafa', borderRadius: '8px', height: '44px' }}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={loading || cart.length === 0}
                style={{ flex: 2, backgroundColor: '#dc2626', color: 'white', borderRadius: '8px', height: '44px', fontWeight: '600', opacity: cart.length === 0 ? 0.5 : 1 }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : `Confirmar Pedido • R$ ${cartTotal.toFixed(2).replace('.', ',')}`}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE OPÇÕES DO PRODUTO */}
      {productModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setProductModal(null)}
        >
          <div
            style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: '12px 12px 0 0', width: '100%', maxWidth: '480px', maxHeight: '85vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Imagem */}
            {productModal.image_url && (
              <img src={productModal.image_url} alt={productModal.name}
                style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '12px 12px 0 0' }} />
            )}

            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ color: '#fafafa', fontWeight: '700', fontSize: '1rem' }}>{productModal.name}</h3>
                  {productModal.description && (
                    <p style={{ color: '#a1a1aa', fontSize: '0.8rem', marginTop: '2px' }}>{productModal.description}</p>
                  )}
                  <p style={{ color: '#dc2626', fontWeight: '700', marginTop: '4px' }}>
                    R$ {productModal.price.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <button onClick={() => setProductModal(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Grupos de opções */}
              {productModal.option_groups?.map(group => (
                <div key={group.id} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#fafafa', fontWeight: '600', fontSize: '0.875rem' }}>{group.name}</span>
                    {group.required && <Badge style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', fontSize: '0.65rem' }}>Obrigatório</Badge>}
                    <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>
                      {group.type === 'radio' ? 'Escolha 1' : `Até ${group.max_select}`}
                    </span>
                  </div>
                  {group.options?.map(option => {
                    const selected = tempOptions[group.id]?.includes(option.id)
                    return (
                      <button
                        key={option.id}
                        onClick={() => handleOptionSelect(group, option.id)}
                        style={{
                          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '0.6rem 0.75rem', borderRadius: '8px', marginBottom: '0.3rem',
                          border: `1px solid ${selected ? '#dc2626' : '#1f1f1f'}`,
                          backgroundColor: selected ? '#3f0000' : '#0a0a0a',
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ color: selected ? '#fca5a5' : '#fafafa', fontSize: '0.875rem' }}>{option.name}</span>
                        <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: '600' }}>
                          {option.price > 0 ? `+R$ ${option.price.toFixed(2).replace('.', ',')}` : 'Grátis'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))}

              {/* Divisão de pizza */}
              {productModal.category?.name?.toLowerCase().includes('pizza') && (
                <div style={{ marginBottom: '1rem' }}>
                  <Label style={{ color: '#fafafa', fontSize: '0.8rem', marginBottom: '0.4rem', display: 'block' }}>
                    Meio a meio (opcional)
                  </Label>
                  <Input value={tempSplitWith} onChange={e => setTempSplitWith(e.target.value)}
                    placeholder="Ex: Frango"
                    style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fafafa', height: '38px' }} />
                  <p style={{ color: '#a1a1aa', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    O sabor principal é {productModal.name}
                  </p>
                </div>
              )}

              {/* Observação do item */}
              <div style={{ marginBottom: '1rem' }}>
                <Label style={{ color: '#fafafa', fontSize: '0.8rem', marginBottom: '0.4rem', display: 'block' }}>
                  Observação do item
                </Label>
                <Input value={tempNotes} onChange={e => setTempNotes(e.target.value)}
                  placeholder="Ex: sem cebola"
                  style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fafafa', height: '38px' }} />
              </div>

              {/* Quantidade + Adicionar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#0a0a0a', borderRadius: '8px', padding: '0.25rem', border: '1px solid #1f1f1f' }}>
                  <button onClick={() => setTempQty(q => Math.max(1, q - 1))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fafafa', padding: '0.25rem' }}>
                    <Minus size={16} />
                  </button>
                  <span style={{ color: '#fafafa', fontWeight: '600', minWidth: '24px', textAlign: 'center' }}>{tempQty}</span>
                  <button onClick={() => setTempQty(q => q + 1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fafafa', padding: '0.25rem' }}>
                    <Plus size={16} />
                  </button>
                </div>
                <Button onClick={handleAddToCart} style={{ flex: 1, backgroundColor: '#dc2626', color: 'white', borderRadius: '8px', height: '44px', fontWeight: '600' }}>
                  Adicionar • R$ {calcItemTotal(productModal, tempOptions, tempQty).toFixed(2).replace('.', ',')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function CategoryBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid',
        borderColor: active ? '#dc2626' : '#1f1f1f',
        backgroundColor: active ? '#dc2626' : '#0a0a0a',
        color: active ? 'white' : '#a1a1aa',
        cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap', fontWeight: active ? '600' : '400',
      }}
    >
      {label}
    </button>
  )
}