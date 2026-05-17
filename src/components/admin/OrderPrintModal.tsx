'use client'

import { useEffect, useRef } from 'react'
import { Order } from '@/types'
import { ORDER_TYPE_LABELS } from '@/constants'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { X, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  order: Order
  settings: Record<string, string>
  onClose: () => void
}

export default function OrderPrintModal({ order, settings, onClose }: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    const content = printRef.current?.innerHTML
    if (!content) return

    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) return

    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Comanda ${order.code}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 302px;
              padding: 8px;
              color: #000;
              background: #fff;
            }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .large { font-size: 16px; }
            .xlarge { font-size: 20px; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .divider-solid { border-top: 1px solid #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; }
            .muted { color: #444; }
            .indent { padding-left: 12px; }
            .mt { margin-top: 4px; }
            .mb { margin-bottom: 4px; }
            @media print {
              body { width: 302px; }
              @page { margin: 0; size: 80mm auto; }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>window.onload = () => { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `)
    win.document.close()
  }

  const itemsSubtotal = order.order_items?.reduce((sum, item) => sum + item.unit_price * item.quantity, 0) ?? 0

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f', borderRadius: '12px', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: '1px solid #1f1f1f' }}>
          <h2 style={{ color: '#fafafa', fontWeight: '700' }}>Comanda {order.code}</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button onClick={handlePrint}
              style={{ backgroundColor: '#dc2626', color: 'white', borderRadius: '8px', height: '36px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Printer size={14} /> Imprimir
            </Button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview da comanda */}
        <div style={{ padding: '1.25rem' }}>
          <div
            ref={printRef}
            style={{
              backgroundColor: 'white',
              color: 'black',
              fontFamily: "'Courier New', monospace",
              fontSize: '12px',
              width: '302px',
              margin: '0 auto',
              padding: '8px',
            }}
          >
            {/* Cabeçalho */}
            <div className="center mb">
              <p className="bold xlarge center">{settings.store_name ?? 'Lanchonete'}</p>
              {settings.instagram && <p className="center muted">@{settings.instagram}</p>}
              {settings.whatsapp && <p className="center muted">WhatsApp: {settings.whatsapp}</p>}
            </div>

            <div style={{ textAlign: 'center', borderTop: '1px dashed #000', borderBottom: '1px dashed #000', margin: '6px 0', padding: '4px 0' }}>
              <p style={{ fontWeight: 'bold', fontSize: '16px' }}>{order.code}</p>
              <p style={{ color: '#444', fontSize: '11px' }}>
                {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            {/* Cliente */}
            <div style={{ margin: '6px 0' }}>
              <p><strong>Cliente:</strong> {order.customer_name}</p>
              {order.phone && <p><strong>Tel:</strong> {order.phone}</p>}
              <p><strong>Tipo:</strong> {ORDER_TYPE_LABELS[order.type].toUpperCase()}
                {order.table_number && ` — Mesa ${order.table_number}`}
              </p>
              {order.address && <p><strong>End:</strong> {order.address}</p>}
            </div>

            <div style={{ borderTop: '1px solid #000', margin: '6px 0' }} />

            {/* Itens */}
            {order.order_items?.map((item, idx) => (
              <div key={idx} style={{ marginBottom: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>
                    {item.quantity}x {item.product_name}
                    {item.split_with && ` / ${item.split_with}`}
                  </span>
                  <span>R${(item.unit_price * item.quantity).toFixed(2).replace('.', ',')}</span>
                </div>
                {item.order_item_options?.map(opt => (
                  <div key={opt.option_name} style={{ paddingLeft: '12px', color: '#444', fontSize: '11px' }}>
                    + {opt.option_name}
                    {opt.option_price > 0 && ` (+R$${opt.option_price.toFixed(2).replace('.', ',')})`}
                  </div>
                ))}
                {item.notes && (
                  <div style={{ paddingLeft: '12px', color: '#444', fontSize: '11px', fontStyle: 'italic' }}>
                    Obs: {item.notes}
                  </div>
                )}
              </div>
            ))}

            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />

            {/* Observação do pedido */}
            {order.notes && (
              <>
                <p style={{ fontSize: '11px', fontStyle: 'italic', color: '#444' }}>Obs: {order.notes}</p>
                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
              </>
            )}

            {/* Totais */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>R${itemsSubtotal.toFixed(2).replace('.', ',')}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444' }}>
                  <span>Taxa entrega</span>
                  <span>R${order.delivery_fee.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {order.card_fee_amount && order.card_fee_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#444' }}>
                  <span>Taxa cartão ({order.card_fee}%)</span>
                  <span>R${order.card_fee_amount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '4px', borderTop: '1px solid #000', paddingTop: '4px' }}>
                <span>TOTAL</span>
                <span>R${order.total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            {/* PIX */}
            {settings.pix_key && (
              <>
                <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
                <p style={{ textAlign: 'center', fontSize: '11px' }}>
                  PIX: <strong>{settings.pix_key}</strong>
                </p>
              </>
            )}

            {/* Rodapé */}
            <div style={{ borderTop: '1px dashed #000', margin: '6px 0' }} />
            <p style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px' }}>
              {settings.receipt_footer_1 ?? 'Deus é fiel'}
            </p>
            {settings.receipt_footer_2 && (
              <p style={{ textAlign: 'center', fontSize: '11px', color: '#444' }}>
                {settings.receipt_footer_2}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}