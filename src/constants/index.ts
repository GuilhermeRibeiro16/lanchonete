export const ORDER_STATUS_LABELS = {
  received: 'Recebido',
  preparing: 'Preparando',
  ready: 'Pronto',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
} as const

export const ORDER_TYPE_LABELS = {
  delivery: 'Entrega',
  pickup: 'Retirada',
  table: 'Mesa',
} as const

export const ORDER_ORIGIN_LABELS = {
  admin: 'Balcão',
  customer: 'Cardápio',
} as const

export const STATUS_COLORS = {
  received: 'bg-yellow-500',
  preparing: 'bg-blue-500',
  ready: 'bg-green-500',
  delivered: 'bg-gray-500',
  cancelled: 'bg-red-500',
} as const