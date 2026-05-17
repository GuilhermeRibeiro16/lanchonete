'use client'

import { useState } from 'react'
import { getOrdersByPhone } from '@/lib/actions/orders'
import { Order } from '@/types'
import { ORDER_STATUS_LABELS, ORDER_TYPE_LABELS } from '@/constants'
import { Search, Loader2, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'

export default function HistoricoPage() {
  const [phone, setPhone] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function handleSearch() {
    if (!phone.trim()) return
    setLoading(true)
    try {
      const data = await getOrdersByPhone(phone.trim())
      setOrders(data)
      setSearched(true)
    } catch {
      setOrders([])
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', padding: '1rem' }}>

      {/* Header */}
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingTop: '0.5rem' }}>
          <Link href="/cardapio"
            style={{ color: '#a1a1aa', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ color: '#fafafa', fontSize: '1.2rem', fontWeight: '700' }}>
            Meus Pedidos
          </h1>
        </div>

        {/* Busca por telefone */}
        <div style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <p style={{ color: '#a1a1aa', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
            Digite seu telefone para ver seus pedidos anteriores
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="(00) 00000-0000"
              style={{
                flex: 1, backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f',
                color: '#fafafa', borderRadius: '8px', padding: '0.75rem',
                fontSize: '0.875rem', outline: 'none',
              }}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{
                backgroundColor: '#dc2626', color: 'white', border: 'none',
                borderRadius: '8px', padding: '0.75rem 1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            </button>
          </div>
        </div>

        {/* Resultados */}
        {searched && (
          <>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#3f3f3f' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</p>
                <p>Nenhum pedido encontrado para esse telefone</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>
                  {orders.length} pedido{orders.length !== 1 ? 's' : ''} encontrado{orders.length !== 1 ? 's' : ''}
                </p>

                {orders.map(order => (
                  <div key={order.id} style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: '12px', overflow: 'hidden' }}>
                    {/* Header do card */}
                    <div
                      onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      style={{ padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: '#fafafa', fontWeight: '700', fontSize: '1rem' }}>
                            {order.code}
                          </span>
                          <span style={{
                            backgroundColor:
                              order.status === 'delivered' ? '#14532d' :
                              order.status === 'cancelled' ? '#3f0000' :
                              order.status === 'ready' ? '#14532d' :
                              order.status === 'preparing' ? '#1e3a5f' : '#713f12',
                            color:
                              order.status === 'delivered' ? '#86efac' :
                              order.status === 'cancelled' ? '#fca5a5' :
                              order.status === 'ready' ? '#86efac' :
                              order.status === 'preparing' ? '#93c5fd' : '#fde68a',
                            fontSize: '0.65rem', fontWeight: '600',
                            padding: '2px 8px', borderRadius: '20px',
                          }}>
                            {ORDER_STATUS_LABELS[order.status]}
                          </span>
                        </div>
                        <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>
                          {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ color: '#dc2626', fontWeight: '700', fontSize: '1rem' }}>
                          R$ {order.total.toFixed(2).replace('.', ',')}
                        </span>
                        {expandedId === order.id
                          ? <ChevronUp size={16} color="#a1a1aa" />
                          : <ChevronDown size={16} color="#a1a1aa" />}
                      </div>
                    </div>

                    {/* Detalhes expandidos */}
                    {expandedId === order.id && (
                      <div style={{ borderTop: '1px solid #1f1f1f', padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                          <div>
                            <p style={{ color: '#a1a1aa', fontSize: '0.7rem' }}>Tipo</p>
                            <p style={{ color: '#fafafa', fontSize: '0.875rem' }}>{ORDER_TYPE_LABELS[order.type]}</p>
                          </div>
                          {order.address && (
                            <div>
                              <p style={{ color: '#a1a1aa', fontSize: '0.7rem' }}>Endereço</p>
                              <p style={{ color: '#fafafa', fontSize: '0.875rem' }}>{order.address}</p>
                            </div>
                          )}
                          {order.table_number && (
                            <div>
                              <p style={{ color: '#a1a1aa', fontSize: '0.7rem' }}>Mesa</p>
                              <p style={{ color: '#fafafa', fontSize: '0.875rem' }}>{order.table_number}</p>
                            </div>
                          )}
                        </div>

                        {/* Itens */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                          {order.order_items?.map(item => (
                            <div key={item.id} style={{ padding: '0.5rem', backgroundColor: '#0a0a0a', borderRadius: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#fafafa', fontSize: '0.875rem' }}>
                                  {item.quantity}x {item.product_name}
                                  {item.split_with && <span style={{ color: '#a1a1aa' }}> / {item.split_with}</span>}
                                </span>
                                <span style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
                                  R$ {(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                              {item.order_item_options?.map(opt => (
                                <p key={opt.option_name} style={{ color: '#a1a1aa', fontSize: '0.75rem', paddingLeft: '0.75rem' }}>
                                  + {opt.option_name}
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>

                        {/* Total */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1f1f1f', paddingTop: '0.75rem' }}>
                          <span style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>Total</span>
                          <span style={{ color: '#dc2626', fontWeight: '700' }}>
                            R$ {order.total.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}