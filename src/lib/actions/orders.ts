'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { OrderStatus, OrderType } from '@/types'

// ================================================
// GERAR CÓDIGO ÚNICO
// ================================================
async function generateOrderCode(): Promise<string> {
  const supabase = createAdminClient()
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

  while (true) {
    let code = '#'
    for (let i = 0; i < 4; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }

    const { data } = await supabase
      .from('orders')
      .select('id')
      .eq('code', code)
      .single()

    if (!data) return code // código único encontrado
  }
}

// ================================================
// BUSCAR PEDIDOS DO DIA
// ================================================
export async function getTodayOrders() {
  const supabase = createAdminClient()

  // Fuso horário Brasília (UTC-3)
  const now = new Date()
  const brasiliaOffset = -3 * 60
  const brasiliaTime = new Date(now.getTime() + (brasiliaOffset - now.getTimezoneOffset()) * 60000)
  const today = brasiliaTime.toISOString().split('T')[0]

  const start = `${today}T00:00:00-03:00`
  const end = `${today}T23:59:59-03:00`

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        order_item_options(*)
      )
    `)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// ================================================
// BUSCAR PEDIDOS POR DATA (histórico)
// ================================================
export async function getOrdersByDate(date: string) {
  const supabase = createAdminClient()

  const start = `${date}T00:00:00-03:00`
  const end = `${date}T23:59:59-03:00`

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        order_item_options(*)
      )
    `)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

// ================================================
// CRIAR PEDIDO
// total calculado no servidor — nunca confiamos no front
// ================================================
export async function createOrder(input: {
  customer_name: string
  phone: string | null
  type: OrderType
  address: string | null
  table_number: string | null
  notes: string | null
  card_fee: number | null
  origin: 'admin' | 'customer'
  items: {
    product_id: string
    quantity: number
    selected_option_ids: string[]
    split_with: string | null
    notes: string | null
  }[]
}) {
  const supabase = createAdminClient()

  // Buscar settings
  const { data: settings } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['delivery_fee', 'card_fee_percent'])

  const settingsMap = Object.fromEntries(settings?.map(s => [s.key, s.value]) ?? [])
  const deliveryFee = input.type === 'delivery' ? parseFloat(settingsMap.delivery_fee ?? '2') : 0
  const cardFeePercent = input.card_fee ? parseFloat(settingsMap.card_fee_percent ?? '0') : 0

  // Buscar produtos e opções do banco — preços reais
  const productIds = input.items.map(i => i.product_id)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price, available')
    .in('id', productIds)

  if (productsError) throw new Error(productsError.message)

  // Verificar disponibilidade
  const unavailable = products?.filter(p => !p.available)
  if (unavailable && unavailable.length > 0) {
    throw new Error(`Produto indisponível: ${unavailable.map(p => p.name).join(', ')}`)
  }

  // Buscar todas as opções selecionadas
  const allOptionIds = input.items.flatMap(i => i.selected_option_ids)
  const { data: options } = allOptionIds.length > 0
    ? await supabase.from('product_options').select('id, name, price').in('id', allOptionIds)
    : { data: [] }

  const optionsMap = Object.fromEntries(options?.map(o => [o.id, o]) ?? [])
  const productsMap = Object.fromEntries(products?.map(p => [p.id, p]) ?? [])

  // Calcular total
  let itemsTotal = 0
  const processedItems = input.items.map(item => {
    const product = productsMap[item.product_id]
    const itemOptions = item.selected_option_ids.map(id => optionsMap[id]).filter(Boolean)
    const optionsPrice = itemOptions.reduce((sum, o) => sum + o.price, 0)
    const unitPrice = product.price + optionsPrice
    itemsTotal += unitPrice * item.quantity

    return {
      product,
      quantity: item.quantity,
      unitPrice,
      options: itemOptions,
      split_with: item.split_with,
      notes: item.notes,
    }
  })

  const cardFeeAmount = cardFeePercent > 0 ? (itemsTotal + deliveryFee) * (cardFeePercent / 100) : null
  const total = itemsTotal + deliveryFee + (cardFeeAmount ?? 0)

  // Gerar código único
  const code = await generateOrderCode()

  // Inserir pedido
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      code,
      customer_name: input.customer_name,
      phone: input.phone,
      type: input.type,
      address: input.address,
      table_number: input.table_number,
      notes: input.notes,
      delivery_fee: deliveryFee,
      card_fee: input.card_fee ? cardFeePercent : null,
      card_fee_amount: cardFeeAmount,
      status: 'received',
      origin: input.origin,
      total,
    })
    .select()
    .single()

  if (orderError) throw new Error(orderError.message)

  // Inserir itens
  for (const item of processedItems) {
    const { data: orderItem, error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        split_with: item.split_with,
        notes: item.notes,
      })
      .select()
      .single()

    if (itemError) throw new Error(itemError.message)

    // Inserir opções do item
    if (item.options.length > 0) {
      await supabase.from('order_item_options').insert(
        item.options.map(o => ({
          order_item_id: orderItem.id,
          option_name: o.name,
          option_price: o.price,
        }))
      )
    }
  }

  revalidatePath('/admin/orders')
  return order
}

// ================================================
// ATUALIZAR STATUS
// ================================================
export async function updateOrderStatus(id: string, status: OrderStatus) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/orders')
}

// ================================================
// CANCELAR PEDIDO
// ================================================
export async function cancelOrder(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/orders')
}

// ================================================
// EDITAR PEDIDO (dados básicos)
// ================================================
export async function updateOrder(id: string, data: {
  customer_name: string
  phone: string | null
  address: string | null
  type: OrderType
  table_number: string | null
  notes: string | null
}) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('orders')
    .update(data)
    .eq('id', id)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/orders')
}

// ================================================
// BUSCAR PEDIDOS POR TELEFONE (histórico cliente)
// ================================================
export async function getOrdersByPhone(phone: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        order_item_options(*)
      )
    `)
    .eq('phone', phone)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw new Error(error.message)
  return data
}

// ================================================
// BUSCAR PEDIDO POR CÓDIGO
// ================================================
export async function getOrderByCode(code: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items(
        *,
        order_item_options(*)
      )
    `)
    .eq('code', code.toUpperCase())
    .single()

  if (error) return null
  return data
}