'use client'

import { useEffect, useRef } from 'react'
import { getTables, createTable, deleteTable, toggleTable } from '@/lib/actions/tables'
import { Table } from '@/types'
import QRCode from 'qrcode'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Save, Store, Truck, CreditCard, Clock, Share2, Printer, Plus, Trash2, UtensilsCrossed } from 'lucide-react'
import { toast } from 'sonner'
import { updateSettings } from '@/lib/actions/settings'

interface Props {
  initialSettings: Record<string, string>
}

export default function SettingsClient({ initialSettings }: Props) {
  const [settings, setSettings] = useState(initialSettings)
  const [loading, setLoading] = useState(false)

  function handleChange(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setLoading(true)
    try {
      await updateSettings(settings)
      toast.success('Configurações salvas')
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setLoading(false)
    }
  }
// Tables
const [tables, setTables] = useState<Table[]>([])
const [newTableNumber, setNewTableNumber] = useState('')
const [loadingTable, setLoadingTable] = useState(false)
const qrRefs = useRef<Record<string, HTMLCanvasElement | null>>({})

useEffect(() => {
  getTables().then(setTables)
}, [])

useEffect(() => {
  tables.forEach(table => {
    const canvas = qrRefs.current[table.id]
    if (canvas) {
      const url = `${window.location.origin}/cardapio?mesa=${table.number}`
      QRCode.toCanvas(canvas, url, {
        width: 120,
        color: { dark: '#000000', light: '#ffffff' },
      })
    }
  })
}, [tables])

async function handleAddTable() {
  const num = parseInt(newTableNumber)
  if (!num || num < 1) { toast.error('Número inválido'); return }
  if (tables.find(t => t.number === num)) { toast.error('Mesa já existe'); return }
  setLoadingTable(true)
  try {
    const table = await createTable(num)
    setTables(prev => [...prev, table].sort((a, b) => a.number - b.number))
    setNewTableNumber('')
    toast.success(`Mesa ${num} criada`)
  } catch {
    toast.error('Erro ao criar mesa')
  } finally {
    setLoadingTable(false)
  }
}

async function handleDeleteTable(id: string, number: number) {
  if (!confirm(`Deletar Mesa ${number}?`)) return
  try {
    await deleteTable(id)
    setTables(prev => prev.filter(t => t.id !== id))
    toast.success('Mesa deletada')
  } catch {
    toast.error('Erro ao deletar mesa')
  }
}

function handlePrintQR(table: Table) {
  const canvas = qrRefs.current[table.id]
  if (!canvas) return
  const url = canvas.toDataURL()
  const win = window.open('', '_blank', 'width=300,height=400')
  if (!win) return
  win.document.write(`
    <!DOCTYPE html><html><head><title>Mesa ${table.number}</title>
    <style>
      body { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; font-family:sans-serif; background:#fff; }
      h1 { font-size:2rem; margin-bottom:1rem; }
      p { color:#666; margin-top:0.5rem; font-size:0.875rem; }
      @media print { @page { margin: 0; } }
    </style></head>
    <body>
      <h1>Mesa ${table.number}</h1>
      <img src="${url}" width="200" height="200" />
      <p>Escaneie para fazer seu pedido</p>
      <script>window.onload = () => { window.print(); window.close(); }<\/script>
    </body></html>
  `)
  win.document.close()
}



  return (
    <div style={{ padding: '1rem', maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ color: '#fafafa', fontSize: '1.2rem', fontWeight: '700' }}>Configurações</h1>
        <Button
          onClick={handleSave}
          disabled={loading}
          style={{ backgroundColor: '#dc2626', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Loja */}
        <Section icon={<Store size={16} color="#dc2626" />} title="Dados da Loja">
          <Field label="Nome da loja">
            <Input
              value={settings.store_name ?? ''}
              onChange={e => handleChange('store_name', e.target.value)}
              placeholder="Ex: Lanchonete"
              style={inputStyle}
            />
          </Field>
          <Field label="Horário de funcionamento">
            <Input
              value={settings.opening_hours ?? ''}
              onChange={e => handleChange('opening_hours', e.target.value)}
              placeholder="Ex: Terça a Domingo, 18h às 23h45"
              style={inputStyle}
            />
          </Field>
        </Section>

        {/* Taxas */}
        <Section icon={<Truck size={16} color="#dc2626" />} title="Taxas">
          <Field label="Taxa de entrega (R$)">
            <Input
              value={settings.delivery_fee ?? ''}
              onChange={e => handleChange('delivery_fee', e.target.value)}
              placeholder="2.00"
              style={inputStyle}
            />
          </Field>
          <Field label="Taxa de cartão (%)">
            <Input
              value={settings.card_fee_percent ?? ''}
              onChange={e => handleChange('card_fee_percent', e.target.value)}
              placeholder="3.00"
              style={inputStyle}
            />
          </Field>
        </Section>

        {/* Pagamento */}
        <Section icon={<CreditCard size={16} color="#dc2626" />} title="Pagamento">
          <Field label="Chave PIX">
            <Input
              value={settings.pix_key ?? ''}
              onChange={e => handleChange('pix_key', e.target.value)}
              placeholder="CPF, CNPJ, email ou chave aleatória"
              style={inputStyle}
            />
          </Field>
        </Section>

        {/* Redes sociais */}
        <Section icon={<Share2 size={16} color="#dc2626" />} title="Redes Sociais">
          <Field label="Instagram (sem @)">
            <Input
              value={settings.instagram ?? ''}
              onChange={e => handleChange('instagram', e.target.value)}
              placeholder="seu.perfil"
              style={inputStyle}
            />
          </Field>
          <Field label="WhatsApp (com DDD)">
            <Input
              value={settings.whatsapp ?? ''}
              onChange={e => handleChange('whatsapp', e.target.value)}
              placeholder="82999999999"
              style={inputStyle}
            />
          </Field>
        </Section>

        {/* Comanda */}
        <Section icon={<Printer size={16} color="#dc2626" />} title="Rodapé da Comanda">
          <Field label="Frase principal">
            <Input
              value={settings.receipt_footer_1 ?? ''}
              onChange={e => handleChange('receipt_footer_1', e.target.value)}
              placeholder="Deus é fiel"
              style={inputStyle}
            />
          </Field>
          <Field label="Frase secundária">
            <Input
              value={settings.receipt_footer_2 ?? ''}
              onChange={e => handleChange('receipt_footer_2', e.target.value)}
              placeholder="Obrigado pela preferência!"
              style={inputStyle}
            />
          </Field>
        </Section>

      </div>
      {/* Mesas e QR Codes */}
<Section icon={<UtensilsCrossed size={16} color="#dc2626" />} title="Mesas e QR Codes">
  <div style={{ display: 'flex', gap: '0.5rem' }}>
    <Input
      type="number"
      value={newTableNumber}
      onChange={e => setNewTableNumber(e.target.value)}
      placeholder="Número da mesa"
      onKeyDown={e => e.key === 'Enter' && handleAddTable()}
      style={inputStyle}
    />
    <Button
      onClick={handleAddTable}
      disabled={loadingTable}
      style={{ backgroundColor: '#dc2626', color: 'white', borderRadius: '8px', whiteSpace: 'nowrap' }}
    >
      {loadingTable ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
    </Button>
  </div>

  {tables.length === 0 ? (
    <p style={{ color: '#3f3f3f', fontSize: '0.875rem', textAlign: 'center', padding: '1rem' }}>
      Nenhuma mesa cadastrada
    </p>
  ) : (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '0.5rem' }}>
      {tables.map(table => (
        <div key={table.id} style={{ backgroundColor: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '10px', padding: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#fafafa', fontWeight: '700', fontSize: '0.9rem' }}>Mesa {table.number}</span>
          <canvas ref={el => { qrRefs.current[table.id] = el }} style={{ borderRadius: '6px' }} />
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => handlePrintQR(table)}
              style={{ backgroundColor: '#1f1f1f', color: '#fafafa', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Printer size={12} /> Imprimir
            </button>
            <button
              onClick={() => handleDeleteTable(table.id, table.number)}
              style={{ backgroundColor: 'transparent', color: '#dc2626', border: '1px solid #dc2626', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</Section>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#0a0a0a',
  border: '1px solid #1f1f1f',
  color: '#fafafa',
}

function Section({ icon, title, children }: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: '12px', padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #1f1f1f' }}>
        {icon}
        <h2 style={{ color: '#fafafa', fontWeight: '600', fontSize: '0.9rem' }}>{title}</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <Label style={{ color: '#a1a1aa', fontSize: '0.8rem' }}>{label}</Label>
      {children}
    </div>
  )
}