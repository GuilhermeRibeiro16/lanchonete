'use client'

import { useState } from 'react'
import { CartItem } from '@/types'
import { X, Trash2, Loader2, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { createOrder } from '@/lib/actions/orders'

interface Props {
  cart: CartItem[]
  settings: Record<string, string>
    tableNumber: string | null  // adicionar
  onClose: () => void
  onRemove: (index: number) => void
  onClear: () => void
  onOrderPlaced: (code: string) => void
}

type Step = 'cart' | 'checkout' | 'success'

export default function CartDrawer({ cart, settings, onClose, onRemove, onClear, onOrderPlaced }: Props) {
  const [step, setStep] = useState<Step>('cart')
  const [orderCode, setOrderCode] = useState('')

  // Checkout form
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [type, setType] = useState<'pickup' | 'delivery' | 'table'>('pickup')
  const [address, setAddress] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const deliveryFee = type === 'delivery' ? parseFloat(settings.delivery_fee ?? '2') : 0
  const subtotal = cart.reduce((sum, i) => sum + i.itemTotal, 0)
  const total = subtotal + deliveryFee

  async function handlePlaceOrder() {
    if (!name.trim()) { toast.error('Informe seu nome'); return }
    if (!phone.trim()) { toast.error('Informe seu telefone'); return }
    if (type === 'delivery' && !address.trim()) { toast.error('Informe o endereço'); return }
    if (type === 'table' && !tableNumber.trim()) { toast.error('Informe o número da mesa'); return }

    setLoading(true)
    try {
      const order = await createOrder({
        customer_name: name.trim(),
        phone: phone.trim(),
        type,
        address: type === 'delivery' ? address.trim() : null,
        table_number: type === 'table' ? tableNumber.trim() : null,
        notes: notes.trim() || null,
        card_fee: null,
        origin: 'customer',
        items: cart.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          selected_option_ids: item.selectedOptions.map(o => o.option_id),
          split_with: item.split_with,
          notes: item.notes,
        }))
      })

      setOrderCode(order.code)
      setStep('success')
      onOrderPlaced(order.code)
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao finalizar pedido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: '#141414', borderRadius: '16px 16px 0 0', width: '100%', maxWidth: '480px', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', borderBottom: '1px solid #1f1f1f', position: 'sticky', top: 0, backgroundColor: '#141414', zIndex: 10 }}>
          <h2 style={{ color: '#fafafa', fontWeight: '700', fontSize: '1rem' }}>
            {step === 'cart' ? '🛒 Carrinho' : step === 'checkout' ? '📋 Finalizar pedido' : '✅ Pedido confirmado!'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa' }}>
            <X size={20} />
          </button>
        </div>

        {/* STEP: CARRINHO */}
        {step === 'cart' && (
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#3f3f3f' }}>
                <ShoppingBag size={40} style={{ margin: '0 auto 1rem' }} />
                <p>Carrinho vazio</p>
              </div>
            ) : (
              <>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', backgroundColor: '#0a0a0a', borderRadius: '10px', border: '1px solid #1f1f1f' }}>
                    {item.product.image_url && (
                      <img src={item.product.image_url} alt={item.product.name}
                        style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <p style={{ color: '#fafafa', fontSize: '0.875rem', fontWeight: '600' }}>
                          {item.quantity}x {item.product.name}
                          {item.split_with && <span style={{ color: '#a1a1aa', fontWeight: '400' }}> / {item.split_with}</span>}
                        </p>
                        <button onClick={() => onRemove(idx)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3f3f3f', flexShrink: 0 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {item.selectedOptions.map(opt => (
                        <p key={opt.option_id} style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>
                          + {opt.option_name}
                          {opt.option_price > 0 && ` (+R$ ${opt.option_price.toFixed(2).replace('.', ',')})`}
                        </p>
                      ))}
                      {item.notes && (
                        <p style={{ color: '#a1a1aa', fontSize: '0.75rem', fontStyle: 'italic' }}>
                          Obs: {item.notes}
                        </p>
                      )}
                      <p style={{ color: '#dc2626', fontSize: '0.875rem', fontWeight: '700', marginTop: '4px' }}>
                        R$ {item.itemTotal.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid #1f1f1f', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fafafa', fontWeight: '700', fontSize: '1rem' }}>
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={onClear}
                    style={{ flex: 1, backgroundColor: '#1f1f1f', color: '#a1a1aa', border: 'none', borderRadius: '10px', padding: '0.875rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                    Limpar
                  </button>
                  <button onClick={() => setStep('checkout')}
                    style={{ flex: 2, backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', padding: '0.875rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700' }}>
                    Finalizar pedido →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* STEP: CHECKOUT */}
        {step === 'checkout' && (
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>Seu nome *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Como você se chama?"
                style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fafafa', borderRadius: '10px', padding: '0.75rem', fontSize: '0.875rem', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>Telefone *</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000"
                style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fafafa', borderRadius: '10px', padding: '0.75rem', fontSize: '0.875rem', outline: 'none' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>Como vai retirar? *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['pickup', 'delivery', 'table'] as const).map(t => (
                  <button key={t} onClick={() => setType(t)}
                    style={{
                      flex: 1, padding: '0.6rem', borderRadius: '10px',
                      border: `1px solid ${type === t ? '#dc2626' : '#1f1f1f'}`,
                      backgroundColor: type === t ? '#1a0000' : '#0a0a0a',
                      color: type === t ? '#fca5a5' : '#a1a1aa',
                      cursor: 'pointer', fontSize: '0.75rem', fontWeight: type === t ? '700' : '400',
                    }}>
                    {t === 'pickup' ? '🏪 Retirar' : t === 'delivery' ? '🚚 Entrega' : '🍽️ Mesa'}
                  </button>
                ))}
              </div>
            </div>

            {type === 'delivery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>Endereço *</label>
                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, bairro"
                  style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fafafa', borderRadius: '10px', padding: '0.75rem', fontSize: '0.875rem', outline: 'none' }} />
              </div>
            )}

            {type === 'table' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>Número da mesa *</label>
                <input value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="Ex: 3"
                  style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fafafa', borderRadius: '10px', padding: '0.75rem', fontSize: '0.875rem', outline: 'none' }} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>Observação geral</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Alguma observação?" rows={2}
                style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', color: '#fafafa', borderRadius: '10px', padding: '0.75rem', fontSize: '0.875rem', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
            </div>

            {/* Resumo */}
            <div style={{ backgroundColor: '#0a0a0a', borderRadius: '10px', padding: '0.75rem', border: '1px solid #1f1f1f' }}>
              {cart.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '2px' }}>
                  <span>{item.quantity}x {item.product.name}</span>
                  <span>R$ {item.itemTotal.toFixed(2).replace('.', ',')}</span>
                </div>
              ))}
              {deliveryFee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '0.8rem', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #1f1f1f' }}>
                  <span>Taxa de entrega</span>
                  <span>R$ {deliveryFee.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fafafa', fontWeight: '700', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #1f1f1f' }}>
                <span>Total</span>
                <span style={{ color: '#dc2626' }}>R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setStep('cart')}
                style={{ flex: 1, backgroundColor: '#1f1f1f', color: '#a1a1aa', border: 'none', borderRadius: '10px', padding: '0.875rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                ← Voltar
              </button>
              <button onClick={handlePlaceOrder} disabled={loading}
                style={{ flex: 2, backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', padding: '0.875rem', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: '700', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Enviando...</> : 'Confirmar pedido'}
              </button>
            </div>
          </div>
        )}

        {/* STEP: SUCESSO */}
        {step === 'success' && (
          <div style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '72px', height: '72px', backgroundColor: '#14532d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
              ✅
            </div>
            <div>
              <h3 style={{ color: '#fafafa', fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                Pedido realizado!
              </h3>
              <p style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
                Seu código de acompanhamento é:
              </p>
            </div>
            <div style={{ backgroundColor: '#0a0a0a', border: '2px solid #dc2626', borderRadius: '12px', padding: '1rem 2rem' }}>
              <p style={{ color: '#dc2626', fontSize: '2rem', fontWeight: '900', letterSpacing: '4px' }}>
                {orderCode}
              </p>
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '0.8rem', maxWidth: '280px' }}>
              Guarde esse código para acompanhar seu pedido no histórico.
            </p>
            <button onClick={onClose}
              style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '10px', padding: '0.875rem 2rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700', marginTop: '0.5rem' }}>
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}