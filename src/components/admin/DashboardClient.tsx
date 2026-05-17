'use client'

import { useState } from 'react'
import { getDashboardData } from '@/lib/actions/dashboard'
import { Loader2, TrendingUp, ShoppingBag, CheckCircle, Receipt, Clock, Monitor, Smartphone } from 'lucide-react'
import { toast } from 'sonner'

type Period = 'day' | 'week' | 'month' | 'year'
type DashboardData = Awaited<ReturnType<typeof getDashboardData>>

interface Props {
  initialData: DashboardData
  initialPeriod: Period
}

const PERIOD_LABELS: Record<Period, string> = {
  day: 'Hoje',
  week: 'Últimos 7 dias',
  month: 'Este mês',
  year: 'Este ano',
}

export default function DashboardClient({ initialData, initialPeriod }: Props) {
  const [data, setData] = useState(initialData)
  const [period, setPeriod] = useState<Period>(initialPeriod)
  const [loading, setLoading] = useState(false)

  async function handlePeriodChange(p: Period) {
    setPeriod(p)
    setLoading(true)
    try {
      const fresh = await getDashboardData(p)
      setData(fresh)
    } catch {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const maxRevenue = Math.max(...data.chartData.map(d => d.revenue), 1)

  return (
    <div style={{ padding: '1rem', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header + período */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h1 style={{ color: '#fafafa', fontSize: '1.2rem', fontWeight: '700' }}>Dashboard</h1>
        <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#141414', padding: '0.25rem', borderRadius: '10px', border: '1px solid #1f1f1f' }}>
          {(['day', 'week', 'month', 'year'] as Period[]).map(p => (
            <button key={p} onClick={() => handlePeriodChange(p)}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                backgroundColor: period === p ? '#dc2626' : 'transparent',
                color: period === p ? 'white' : '#a1a1aa',
                fontSize: '0.8rem', fontWeight: period === p ? '600' : '400',
                transition: 'all 0.15s',
              }}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={28} className="animate-spin" color="#dc2626" />
        </div>
      ) : (
        <>
          {/* Métricas principais */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <MetricCard
              icon={<TrendingUp size={20} color="#dc2626" />}
              label="Faturamento"
              value={`R$ ${data.totalRevenue.toFixed(2).replace('.', ',')}`}
              color="#dc2626"
            />
            <MetricCard
              icon={<ShoppingBag size={20} color="#3b82f6" />}
              label="Pedidos"
              value={String(data.totalOrders)}
              color="#3b82f6"
            />
            <MetricCard
              icon={<CheckCircle size={20} color="#22c55e" />}
              label="Entregues"
              value={String(data.deliveredOrders)}
              color="#22c55e"
            />
            <MetricCard
              icon={<Receipt size={20} color="#eab308" />}
              label="Ticket médio"
              value={`R$ ${data.avgTicket.toFixed(2).replace('.', ',')}`}
              color="#eab308"
            />
          </div>

          {/* Origem dos pedidos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Monitor size={20} color="#a1a1aa" />
              <div>
                <p style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>Balcão</p>
                <p style={{ color: '#fafafa', fontSize: '1.25rem', fontWeight: '700' }}>{data.adminOrders}</p>
              </div>
            </div>
            <div style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Smartphone size={20} color="#dc2626" />
              <div>
                <p style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>Cardápio online</p>
                <p style={{ color: '#dc2626', fontSize: '1.25rem', fontWeight: '700' }}>{data.customerOrders}</p>
              </div>
            </div>
          </div>

          {/* Gráfico de faturamento */}
          {data.chartData.length > 0 && (
            <div style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
              <h2 style={{ color: '#fafafa', fontWeight: '600', fontSize: '0.95rem', marginBottom: '1rem' }}>
                Faturamento {period === 'day' ? 'por hora' : 'por dia'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '160px', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {data.chartData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '32px', flex: 1 }}>
                    <span style={{ color: '#a1a1aa', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                      {d.revenue > 0 ? `R$${d.revenue.toFixed(0)}` : ''}
                    </span>
                    <div
                      title={`${d.label}: R$ ${d.revenue.toFixed(2)} (${d.orders} pedidos)`}
                      style={{
                        width: '100%', borderRadius: '4px 4px 0 0',
                        backgroundColor: d.revenue > 0 ? '#dc2626' : '#1f1f1f',
                        height: `${Math.max((d.revenue / maxRevenue) * 120, d.revenue > 0 ? 4 : 2)}px`,
                        transition: 'height 0.3s',
                        cursor: 'default',
                      }}
                    />
                    <span style={{ color: '#a1a1aa', fontSize: '0.6rem', whiteSpace: 'nowrap' }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* Produtos mais vendidos */}
            <div style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '1.25rem' }}>
              <h2 style={{ color: '#fafafa', fontWeight: '600', fontSize: '0.95rem', marginBottom: '1rem' }}>
                Mais vendidos
              </h2>
              {data.topProducts.length === 0 ? (
                <p style={{ color: '#3f3f3f', fontSize: '0.875rem' }}>Sem dados</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {data.topProducts.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: i === 0 ? '#dc2626' : '#3f3f3f', fontSize: '0.75rem', fontWeight: '700', minWidth: '18px' }}>
                          #{i + 1}
                        </span>
                        <span style={{ color: '#fafafa', fontSize: '0.8rem' }}>{p.name}</span>
                      </div>
                      <span style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>{p.quantity}x</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Horários de pico */}
            <div style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '1.25rem' }}>
              <h2 style={{ color: '#fafafa', fontWeight: '600', fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} /> Horários de pico
              </h2>
              {data.peakHours.length === 0 ? (
                <p style={{ color: '#3f3f3f', fontSize: '0.875rem' }}>Sem dados</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {data.peakHours.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#fafafa', fontSize: '0.875rem', fontWeight: '600' }}>{p.hour}</span>
                      <div style={{ flex: 1, margin: '0 0.75rem', backgroundColor: '#1f1f1f', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '4px', backgroundColor: '#dc2626',
                          width: `${(p.count / data.peakHours[0].count) * 100}%`,
                        }} />
                      </div>
                      <span style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>{p.count} pedidos</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MetricCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string
}) {
  return (
    <div style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        {icon}
        <span style={{ color: '#a1a1aa', fontSize: '0.75rem' }}>{label}</span>
      </div>
      <p style={{ color, fontSize: '1.35rem', fontWeight: '700' }}>{value}</p>
    </div>
  )
}