'use client'

import { useState } from 'react'
import { Order } from '@/types'
import { ORDER_STATUS_LABELS, ORDER_TYPE_LABELS } from '@/constants'
import { getOrdersByDate } from '@/lib/actions/orders'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, ChevronDown, ChevronUp, Loader2, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  initialOrders: Order[]
  initialDate: string
}

export default function HistoryClient({ initialOrders, initialDate }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [date, setDate] = useState(initialDate)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleDateChange(newDate: string) {
    setDate(newDate)
    setLoading(true)
    try {
      const data = await getOrdersByDate(newDate)
      setOrders(data)
    } catch {
      console.error('Erro ao buscar pedidos')
    } finally {
      setLoading(false)
    }
  }

  const filtered = search
    ? orders.filter(o =>
        o.code.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        (o.phone ?? '').includes(search)
      )
    : orders

  const revenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0)

  const delivered = orders.filter(o => o.status === 'delivered').length
  const cancelled = orders.filter(o => o.status === 'cancelled').length

  return (
    <div style={{ padding: '1rem', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ color: '#fafafa', fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
          Histórico de Pedidos
        </h1>
        <p style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>
          Consulte pedidos por data
        </p>
      </div>

      {/* Seletor de data + busca */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Calendar size={16} style={{ position: 'absolute', left: '12px', color: '#3f3f3f', pointerEvents: 'none' }} />
          <input
            type="date"
            value={date}
            onChange={e => handleDateChange(e.target.value)}
            style={{
              backgroundColor: '#141414', border: '1px solid #1f1f1f', color: '#fafafa',
              borderRadius: '8px', padding: '0.5rem 0.75rem 0.5rem 36px',
              fontSize: '0.875rem', cursor: 'pointer', outline: 'none',
            }}
          />
        </div>
        <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#3f3f3f' }} />
          <Input
            placeholder="Buscar por código, nome ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', color: '#fafafa', paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Métricas do dia */}
      <div style={{
        backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: '12px',
        padding: '1rem 1.25rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
        marginBottom: '1.25rem', alignItems: 'center',
      }}>
        <div>
          <p style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>
            {format(new Date(date + 'T12:00:00'), "dd 'de' MMMM", { locale: ptBR })}
          </p>
          <p style={{ color: '#dc2626', fontSize: '1.5rem', fontWeight: '700' }}>
            R$ {revenue.toFixed(2).replace('.', ',')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Metric label="Total" value={orders.length} />
          <Metric label="Entregues" value={delivered} color="#22c55e" />
          <Metric label="Cancelados" value={cancelled} color="#dc2626" />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader2 size={24} className="animate-spin" color="#dc2626" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#3f3f3f' }}>
          Nenhum pedido encontrado
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(order => (
            <div
              key={order.id}
              style={{
                backgroundColor: '#141414', border: '1px solid #1f1f1f',
                borderRadius: '10px', overflow: 'hidden',
                opacity: order.status === 'cancelled' ? 0.5 : 1,
              }}
            >
              {/* Header */}
              <div
                onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                style={{ padding: '0.875rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
              >
                <span style={{ color: '#fafafa', fontWeight: '700', fontSize: '0.9rem', minWidth: '60px' }}>
                  {order.code}
                </span>
                <span style={{ color: '#fafafa', flex: 1, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {order.customer_name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                  <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>
                    {format(new Date(order.created_at), 'HH:mm')}
                  </span>
                  <Badge style={{
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
                    fontSize: '0.65rem'
                  }}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                  <Badge style={{ backgroundColor: '#1f1f1f', color: '#a1a1aa', fontSize: '0.65rem' }}>
                    {ORDER_TYPE_LABELS[order.type]}
                  </Badge>
                  <span style={{ color: '#dc2626', fontWeight: '700', fontSize: '0.875rem' }}>
                    R$ {order.total.toFixed(2).replace('.', ',')}
                  </span>
                  {expandedId === order.id
                    ? <ChevronUp size={14} color="#a1a1aa" />
                    : <ChevronDown size={14} color="#a1a1aa" />}
                </div>
              </div>

              {/* Expandido */}
              {expandedId === order.id && (
                <div style={{ borderTop: '1px solid #1f1f1f', padding: '1rem' }}>
                  {/* Info */}
                  <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {order.phone && <Info label="Telefone" value={order.phone} />}
                    {order.address && <Info label="Endereço" value={order.address} />}
                    {order.table_number && <Info label="Mesa" value={order.table_number} />}
                    <Info label="Origem" value={order.origin === 'admin' ? 'Balcão' : 'Cardápio online'} />
                  </div>

                  {/* Itens */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    {order.order_items?.map(item => (
                      <div key={item.id} style={{ padding: '0.4rem 0', borderBottom: '1px solid #1f1f1f' }}>
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
                          <div key={opt.option_name} style={{ color: '#a1a1aa', fontSize: '0.8rem', paddingLeft: '1rem' }}>
                            + {opt.option_name}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Totais */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    {order.delivery_fee > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '0.8rem' }}>
                        <span>Taxa entrega</span>
                        <span>R$ {order.delivery_fee.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    {order.card_fee_amount && order.card_fee_amount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '0.8rem' }}>
                        <span>Taxa cartão ({order.card_fee}%)</span>
                        <span>R$ {order.card_fee_amount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fafafa', fontWeight: '700' }}>
                      <span>Total</span>
                      <span style={{ color: '#dc2626' }}>R$ {order.total.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>

                  {order.notes && (
                    <div style={{ backgroundColor: '#0a0a0a', borderRadius: '6px', padding: '0.5rem 0.75rem', marginTop: '0.75rem' }}>
                      <span style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>📝 {order.notes}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, color = '#fafafa' }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <p style={{ color, fontSize: '1.25rem', fontWeight: '700' }}>{value}</p>
      <p style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>{label}</p>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ color: '#a1a1aa', fontSize: '0.7rem' }}>{label}</p>
      <p style={{ color: '#fafafa', fontSize: '0.875rem' }}>{value}</p>
    </div>
  )
}