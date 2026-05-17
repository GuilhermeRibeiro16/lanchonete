export type OrderStatus = 'received' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
export type OrderType = 'delivery' | 'pickup' | 'table'
export type OrderOrigin = 'admin' | 'customer'
export type OptionGroupType = 'radio' | 'checkbox'

export interface Category {
  id: string
  name: string
  sort_order: number
  deleted_at: string | null
}

export interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category_id: string
  available: boolean
  sort_order: number
  deleted_at: string | null
  category?: Category
  option_groups?: ProductOptionGroup[]
}

export interface ProductOptionGroup {
  id: string
  product_id: string
  name: string
  type: OptionGroupType
  required: boolean
  min_select: number
  max_select: number
  included_count: number
  sort_order: number
  options?: ProductOption[]
}

export interface ProductOption {
  id: string
  group_id: string
  name: string
  price: number
  available: boolean
  sort_order: number
}

export interface Order {
  id: string
  code: string
  customer_name: string
  phone: string | null
  type: OrderType
  address: string | null
  table_number: string | null
  delivery_fee: number
  card_fee: number | null
  card_fee_amount: number | null
  status: OrderStatus
  origin: OrderOrigin
  total: number
  notes: string | null
  created_at: string
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  split_with: string | null
  notes: string | null
  order_item_options?: OrderItemOption[]
}

export interface OrderItemOption {
  id: string
  order_item_id: string
  option_name: string
  option_price: number
}

export interface Table {
  id: string
  number: number
  qr_code_url: string | null
  active: boolean
}

export interface Setting {
  id: string
  key: string
  value: string | null
}

export interface CartItem {
  product: Product
  quantity: number
  selectedOptions: {
    group_id: string
    group_name: string
    option_id: string
    option_name: string
    option_price: number
  }[]
  split_with: string | null
  notes: string | null
  itemTotal: number
}