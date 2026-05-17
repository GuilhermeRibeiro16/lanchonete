'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Order, Product, Category } from '@/types'
import { ORDER_STATUS_LABELS, STATUS_COLORS, ORDER_TYPE_LABELS, ORDER_ORIGIN_LABELS } from '@/constants'
import { updateOrderStatus, cancelOrder, getTodayOrders } from '@/lib/actions/orders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import {
  Plus, Search, Printer, ChevronDown, ChevronUp,
  Clock, CheckCircle, XCircle, Truck, Store, UtensilsCrossed
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import CreateOrderModal from './CreateOrderModal'
import OrderPrintModal from './OrderPrintModal'

interface Props {
  initialOrders: Order[]
  products: Product[]
  categories: Category[]
  settings: Record<string, string>
}

export default function OrdersClient({ initialOrders, products, categories, settings }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [createModal, setCreateModal] = useState(false)
  const [printOrder, setPrintOrder] = useState<Order | null>(null)

  // Faturamento do dia
  const dailyRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0)

  // Pedidos ativos e entregues
  const activeOrders = orders.filter(o =>
    ['received', 'preparing', 'ready'].includes(o.status)
  )
  const deliveredOrders = orders.filter(o => o.status === 'delivered')
  const cancelledOrders = orders.filter(o => o.status === 'cancelled')

  // Busca
  const filtered = (list: Order[]) =>
    search
      ? list.filter(o =>
          o.code.toLowerCase().includes(search.toLowerCase()) ||
          o.customer_name.toLowerCase().includes(search.toLowerCase())
        )
      : list

  // Realtime
  const refreshOrders = useCallback(async () => {
    try {
      const fresh = await getTodayOrders()
      setOrders(fresh)
    } catch {
      console.error('Erro ao atualizar pedidos')
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
      }, () => {
        refreshOrders()
      })
      .subscribe()

    // Fallback polling 30s
    const interval = setInterval(refreshOrders, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [refreshOrders])

  async function handleStatusChange(order: Order, newStatus: string) {
    setLoadingId(order.id)
    try {
      await updateOrderStatus(order.id, newStatus as Order['status'])
      setOrders(prev => prev.map(o =>
        o.id === order.id ? { ...o, status: newStatus as Order['status'] } : o
      ))
      toast.success(`Status: ${ORDER_STATUS_LABELS[newStatus as Order['status']]}`)
    } catch {
      toast.error('Erro ao atualizar status')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleCancel(order: Order) {
    if (!confirm(`Cancelar pedido ${order.code}?`)) return
    setLoadingId(order.id)
    try {
      await cancelOrder(order.id)
      setOrders(prev => prev.map(o =>
        o.id === order.id ? { ...o, status: 'cancelled' } : o
      ))
      toast.success('Pedido cancelado')
    } catch {
      toast.error('Erro ao cancelar')
    } finally {
      setLoadingId(null)
    }
  }

  function handleOrderCreated(order: Order) {
    setOrders(prev => [order, ...prev])
    setCreateModal(false)
    toast.success(`Pedido ${order.code} criado!`)
  }

  return (
    <div style={{ padding: '1rem', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header com faturamento */}
      <div style={{
        backgroundColor: '#141414', border: '1px solid #1f1f1f',
        borderRadius: '12px', padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem'
      }}>
        <div>
          <p style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>Faturamento do dia</p>
          <p style={{ color: '#dc2626', fontSize: '1.5rem', fontWeight: '700' }}>
            R$ {dailyRevenue.toFixed(2).replace('.', ',')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Stat label="Ativos" value={activeOrders.length} color="#fafafa" />
          <Stat label="Entregues" value={deliveredOrders.length} color="#22c55e" />
          <Stat label="Cancelados" value={cancelledOrders.length} color="#dc2626" />
        </div>
      </div>

      {/* Busca + Novo pedido */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#3f3f3f' }} />
          <Input
            placeholder="Buscar por código ou nome..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', color: '#fafafa', paddingLeft: '36px' }}
          />
        </div>
        <Button
          onClick={() => setCreateModal(true)}
          style={{ backgroundColor: '#dc2626', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
        >
          <Plus size={16} /> Novo Pedido
        </Button>
      </div>

      {/* PEDIDOS ATIVOS */}
      <Section title="Pedidos Ativos" count={filtered(activeOrders).length}>
        {filtered(activeOrders).length === 0 ? (
          <Empty text="Nenhum pedido ativo" />
        ) : (
          filtered(activeOrders).map(order => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              loading={loadingId === order.id}
              onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
              onStatusChange={handleStatusChange}
              onCancel={handleCancel}
              onPrint={() => setPrintOrder(order)}
            />
          ))
        )}
      </Section>

      {/* ENTREGUES */}
      <Section title="Entregues hoje" count={filtered(deliveredOrders).length} collapsed>
        {filtered(deliveredOrders).map(order => (
          <OrderCard
            key={order.id}
            order={order}
            expanded={expandedId === order.id}
            loading={loadingId === order.id}
            onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
            onStatusChange={handleStatusChange}
            onCancel={handleCancel}
            onPrint={() => setPrintOrder(order)}
          />
        ))}
      </Section>

      {/* Modais */}
      {createModal && (
        <CreateOrderModal
          products={products}
          categories={categories}
          settings={settings}
          onClose={() => setCreateModal(false)}
          onCreated={handleOrderCreated}
        />
      )}

      {printOrder && (
        <OrderPrintModal
          order={printOrder}
          settings={settings}
          onClose={() => setPrintOrder(null)}
        />
      )}
    </div>
  )
}

// ── Componentes auxiliares ──────────────────────────────

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color, fontSize: '1.25rem', fontWeight: '700' }}>{value}</p>
      <p style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>{label}</p>
    </div>
  )
}

function Section({ title, count, children, collapsed = false }: {
  title: string; count: number; children: React.ReactNode; collapsed?: boolean
}) {
  const [open, setOpen] = useState(!collapsed)
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.5rem 0', marginBottom: open ? '0.75rem' : 0,
        }}
      >
        <span style={{ color: '#fafafa', fontWeight: '600', fontSize: '0.95rem' }}>
          {title}
          <span style={{ color: '#a1a1aa', fontWeight: '400', marginLeft: '0.4rem' }}>({count})</span>
        </span>
        {open ? <ChevronUp size={16} color="#a1a1aa" /> : <ChevronDown size={16} color="#a1a1aa" />}
      </button>
      {open && children}
    </div>
  )
}

function Empty({ text }: { text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem', color: '#3f3f3f', fontSize: '0.875rem' }}>
      {text}
    </div>
  )
}

function OrderCard({ order, expanded, loading, onToggle, onStatusChange, onCancel, onPrint }: {
  order: Order
  expanded: boolean
  loading: boolean
  onToggle: () => void
  onStatusChange: (order: Order, status: string) => void
  onCancel: (order: Order) => void
  onPrint: () => void
}) {
  const nextStatus: Record<string, string> = {
    received: 'preparing',
    preparing: 'ready',
    ready: 'delivered',
  }

  const nextLabel: Record<string, string> = {
    received: 'Preparando',
    preparing: 'Pronto',
    ready: 'Entregar',
  }

  const TypeIcon = order.type === 'delivery' ? Truck
    : order.type === 'table' ? UtensilsCrossed : Store

  return (
    <div style={{
      backgroundColor: '#141414',
      border: `1px solid ${order.origin === 'customer' ? '#7f1d1d' : '#1f1f1f'}`,
      borderRadius: '10px',
      marginBottom: '0.75rem',
      overflow: 'hidden',
      opacity: order.status === 'cancelled' ? 0.5 : 1,
    }}>
      {/* Header do card */}
      <div
        onClick={onToggle}
        style={{ padding: '0.875rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
      >
        {/* Status dot */}
        <div style={{
          width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
          backgroundColor: STATUS_COLORS[order.status].replace('bg-', '').includes('yellow') ? '#eab308'
            : STATUS_COLORS[order.status].includes('blue') ? '#3b82f6'
            : STATUS_COLORS[order.status].includes('green') ? '#22c55e'
            : STATUS_COLORS[order.status].includes('red') ? '#dc2626' : '#6b7280'
        }} />

        {/* Código */}
        <span style={{ color: '#fafafa', fontWeight: '700', fontSize: '0.95rem', minWidth: '60px' }}>
          {order.code}
        </span>

        {/* Nome */}
        <span style={{ color: '#fafafa', flex: 1, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {order.customer_name}
        </span>

        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          {order.origin === 'customer' && (
            <Badge style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', fontSize: '0.65rem' }}>
              Online
            </Badge>
          )}
          <Badge style={{ backgroundColor: '#1f1f1f', color: '#a1a1aa', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
            <TypeIcon size={10} />
            {ORDER_TYPE_LABELS[order.type]}
          </Badge>
          <Badge style={{
            backgroundColor: order.status === 'received' ? '#713f12'
              : order.status === 'preparing' ? '#1e3a5f'
              : order.status === 'ready' ? '#14532d'
              : order.status === 'delivered' ? '#1f1f1f'
              : '#3f0000',
            color: order.status === 'received' ? '#fde68a'
              : order.status === 'preparing' ? '#93c5fd'
              : order.status === 'ready' ? '#86efac'
              : order.status === 'delivered' ? '#a1a1aa'
              : '#fca5a5',
            fontSize: '0.65rem'
          }}>
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
          <span style={{ color: '#dc2626', fontWeight: '700', fontSize: '0.875rem' }}>
            R$ {order.total.toFixed(2).replace('.', ',')}
          </span>
          {expanded ? <ChevronUp size={14} color="#a1a1aa" /> : <ChevronDown size={14} color="#a1a1aa" />}
        </div>
      </div>

      {/* Expandido */}
      {expanded && (
        <div style={{ borderTop: '1px solid #1f1f1f', padding: '1rem' }}>
          {/* Info */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <Info label="Horário" value={format(new Date(order.created_at), 'HH:mm', { locale: ptBR })} />
            {order.phone && <Info label="Telefone" value={order.phone} />}
            {order.address && <Info label="Endereço" value={order.address} />}
            {order.table_number && <Info label="Mesa" value={order.table_number} />}
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
                    + {opt.option_name} {opt.option_price > 0 && `(+R$ ${opt.option_price.toFixed(2).replace('.', ',')})`}
                  </div>
                ))}
                {item.notes && (
                  <div style={{ color: '#a1a1aa', fontSize: '0.8rem', fontStyle: 'italic', paddingLeft: '1rem' }}>
                    Obs: {item.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totais */}
          <div style={{ marginBottom: '0.75rem' }}>
            {order.delivery_fee > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '0.8rem' }}>
                <span>Taxa de entrega</span>
                <span>R$ {order.delivery_fee.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            {order.card_fee_amount && order.card_fee_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a1a1aa', fontSize: '0.8rem' }}>
                <span>Taxa cartão ({order.card_fee}%)</span>
                <span>R$ {order.card_fee_amount.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fafafa', fontWeight: '700', marginTop: '0.25rem' }}>
              <span>Total</span>
              <span style={{ color: '#dc2626' }}>R$ {order.total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          {order.notes && (
            <div style={{ backgroundColor: '#0a0a0a', borderRadius: '6px', padding: '0.5rem 0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>📝 {order.notes}</span>
            </div>
          )}

          {/* Ações */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {nextStatus[order.status] && (
              <Button
                onClick={() => onStatusChange(order, nextStatus[order.status])}
                disabled={loading}
                style={{ backgroundColor: '#dc2626', color: 'white', borderRadius: '8px', height: '36px', fontSize: '0.8rem' }}
              >
                ✓ {nextLabel[order.status]}
              </Button>
            )}
            <Button
              onClick={onPrint}
              style={{ backgroundColor: '#1f1f1f', color: '#fafafa', borderRadius: '8px', height: '36px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Printer size={14} /> Imprimir
            </Button>
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <Button
                onClick={() => onCancel(order)}
                disabled={loading}
                style={{ backgroundColor: 'transparent', color: '#dc2626', border: '1px solid #dc2626', borderRadius: '8px', height: '36px', fontSize: '0.8rem' }}
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}
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