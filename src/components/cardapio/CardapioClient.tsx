'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Product, Category, CartItem } from '@/types'
import { ShoppingCart, Phone, Menu, X, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import ProductModal from './ProductModal'
import CartDrawer from './CartDrawer'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'



interface Props {
  categories: Category[]
  products: Product[]
  settings: Record<string, string>
  tableNumber: string | null  // adicionar
}

export default function CardapioClient({ categories, products, settings, tableNumber }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [productModal, setProductModal] = useState<Product | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [heroIndex, setHeroIndex] = useState(0)
  const categoryBarRef = useRef<HTMLDivElement>(null)
  //variaveis para adicionar o slider no carrossel
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const SWIPE_THRESHOLD = 50 // pixels mínimos para considerar swipe

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchMove(e: React.TouchEvent) {
    touchEndX.current = e.touches[0].clientX
  }

  function handleTouchEnd() {
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) < SWIPE_THRESHOLD) return

    if (diff > 0) {
      // Swipe para esquerda — próximo
      setHeroIndex(i => (i + 1) % heroProducts.length)
    } else {
      // Swipe para direita — anterior
      setHeroIndex(i => (i - 1 + heroProducts.length) % heroProducts.length)
    }
  }


    // Realtime — produto indisponível some imediatamente
const [availableProducts, setAvailableProducts] = useState(products)

useEffect(() => {
  setAvailableProducts(products)
}, [products])

useEffect(() => {
  const supabase = createClient()

  const channel = supabase
    .channel('cardapio-realtime')
.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'products',
}, (payload) => {
  const updated = payload.new as any
  setAvailableProducts(prev => {
    if (!updated.available || updated.deleted_at) {
      // Remove se ficou indisponível ou foi deletado
      return prev.filter(p => p.id !== updated.id)
    }
    // Atualiza dados do produto se ainda disponível
    return prev.map(p => p.id === updated.id ? { ...p, ...updated } : p)
  })
})
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])



  // Carregar carrinho do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart')
      if (saved) setCart(JSON.parse(saved))
    } catch {}
  }, [])

  // Salvar carrinho no localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  // Hero carousel — produtos em destaque (primeiros 3)
 const heroProducts = availableProducts.slice(0, 3)
  useEffect(() => {
    if (heroProducts.length <= 1) return
    const timer = setInterval(() => {
      setHeroIndex(i => (i + 1) % heroProducts.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [heroProducts.length])

  const filteredProducts = selectedCategory === 'all'
    ? availableProducts
    : availableProducts.filter(p => p.category_id === selectedCategory)

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)
  const cartTotal = cart.reduce((sum, i) => sum + i.itemTotal, 0)

  function handleAddToCart(item: CartItem) {
    setCart(prev => [...prev, item])
    toast.success(`${item.product.name} adicionado!`, {
      style: { backgroundColor: '#141414', color: '#fafafa', border: '1px solid #1f1f1f' }
    })
  }

  function handleRemoveFromCart(index: number) {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  function handleClearCart() {
    setCart([])
  }

  const whatsappUrl = settings.whatsapp
    ? `https://wa.me/55${settings.whatsapp.replace(/\D/g, '')}`
    : '#'

  const heroProduct = heroProducts[heroIndex]





  return (
    <div style={{ backgroundColor: '#0a0a0a', minHeight: '100vh', paddingBottom: '80px' }}>

      {/* HEADER */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #1f1f1f',
        padding: '0 1rem',
        height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: '#dc2626', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: '16px' }}>🍕</span>
          </div>
          <span style={{ color: '#fafafa', fontWeight: '700', fontSize: '1.1rem' }}>
            {settings.store_name ?? 'Lanchonete'}
          </span>
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {settings.whatsapp && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fafafa', textDecoration: 'none', fontSize: '0.875rem', backgroundColor: '#141414', padding: '0.4rem 0.75rem', borderRadius: '20px', border: '1px solid #1f1f1f' }}>
              <Phone size={14} color="#22c55e" />
              <span style={{ display: 'none' }} className="sm:inline">WhatsApp</span>
            </a>
          )}
          <Link
            href="/historico"
            style={{
              color: '#a1a1aa', fontSize: '0.8rem', textDecoration: 'none',
              padding: '0.4rem 0.75rem', borderRadius: '20px',
              border: '1px solid #1f1f1f', backgroundColor: '#141414',
              whiteSpace: 'nowrap',
            }}
          >
            Meus pedidos
          </Link>
          <button
            onClick={() => setCartOpen(true)}
            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: '#fafafa', padding: '4px' }}
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                backgroundColor: '#dc2626', color: 'white',
                borderRadius: '50%', width: '18px', height: '18px',
                fontSize: '0.65rem', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* HERO CAROUSEL */}
      {heroProduct && (
        <div style={{ position: 'relative', height: '280px', overflow: 'hidden', margin: '0' }}>
          {/* Background blur */}
          {heroProduct.image_url && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${heroProduct.image_url})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'blur(20px) brightness(0.3)',
              transform: 'scale(1.1)',
            }} />
          )}
          
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(10,10,10,0.95) 40%, rgba(10,10,10,0.3))' }} />



          {/* Conteúdo */}
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', alignItems: 'center', padding: '1.5rem' }}>
            <div style={{ flex: 1, paddingRight: '1rem' }}>
              <p style={{ color: '#dc2626', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                Destaque
              </p>
              
              <h2 style={{ color: 'white', fontSize: '1.75rem', fontWeight: '900', textTransform: 'uppercase', lineHeight: 1.1, marginBottom: '0.5rem' }}>
                {heroProduct.name}
              </h2>
              <p style={{ color: '#dc2626', fontSize: '1.35rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                R$ {heroProduct.price.toFixed(2).replace('.', ',')}
              </p>
              {heroProduct.description && (
                <p style={{ color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.4 }}>
                  {heroProduct.description}
                </p>
              )}
              <button
                onClick={() => setProductModal(heroProduct)}
                style={{
                  backgroundColor: '#dc2626', color: 'white',
                  border: 'none', borderRadius: '8px',
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.875rem', fontWeight: '700',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}
              >
                <ShoppingCart size={16} /> COMPRAR
              </button>
            </div>

              

            {/* Imagem do produto */}
            {heroProduct.image_url && (
              <div style={{ width: '160px', height: '160px', flexShrink: 0 }}>
                <img src={heroProduct.image_url} alt={heroProduct.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', border: '3px solid #dc2626' }} />
              </div>
            )}
          </div>
          // Área de swipe para mobile
          <div
          style={{ position: 'relative', height: '280px', overflow: 'hidden' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />  
          {/* Setas — desktop */}
{heroProducts.length > 1 && (
  <>
    <button
      onClick={() => setHeroIndex(i => (i - 1 + heroProducts.length) % heroProducts.length)}
      style={{
        position: 'absolute', left: '12px', top: '50%',
        transform: 'translateY(-50%)', zIndex: 2,
        backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '50%', width: '36px', height: '36px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'white', fontSize: '1rem',
      }}
    >
      ‹
    </button>
    <button
      onClick={() => setHeroIndex(i => (i + 1) % heroProducts.length)}
      style={{
        position: 'absolute', right: '12px', top: '50%',
        transform: 'translateY(-50%)', zIndex: 2,
        backgroundColor: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '50%', width: '36px', height: '36px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'white', fontSize: '1rem',
      }}
    >
      ›
    </button>
  </>
)}
   

          {/* Dots do carousel */}
          {heroProducts.length > 1 && (
            <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 2 }}>
              {heroProducts.map((_, i) => (
                <button key={i} onClick={() => setHeroIndex(i)}
                  style={{ width: i === heroIndex ? '20px' : '8px', height: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer', transition: 'all 0.3s', backgroundColor: i === heroIndex ? '#dc2626' : '#3f3f3f' }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* FILTRO DE CATEGORIAS */}
      <div
        ref={categoryBarRef}
        style={{
          display: 'flex', gap: '0.5rem', overflowX: 'auto',
          padding: '1rem 1rem 0.5rem',
          scrollbarWidth: 'none',
          position: 'sticky', top: '60px', zIndex: 40,
          backgroundColor: '#0a0a0a',
          borderBottom: '1px solid #1f1f1f',
        }}
      >
        <CategoryPill
          label="Todos"
          active={selectedCategory === 'all'}
          onClick={() => setSelectedCategory('all')}
        />
        {categories.map(cat => (
          <CategoryPill
            key={cat.id}
            label={cat.name}
            active={selectedCategory === cat.id}
            onClick={() => setSelectedCategory(cat.id)}
          />
        ))}
      </div>

      {/* GRID DE PRODUTOS */}
      <div style={{ padding: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => setProductModal(product)}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#3f3f3f' }}>
            Nenhum produto disponível
          </div>
        )}
      </div>

      {/* BOTTOM BAR — carrinho fixo */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(10,10,10,0.95)',
          borderTop: '1px solid #1f1f1f',
        }}>
          <button
            onClick={() => setCartOpen(true)}
            style={{
              width: '100%', backgroundColor: '#dc2626', color: 'white',
              border: 'none', borderRadius: '12px', padding: '0.875rem',
              fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>
              {cartCount} {cartCount === 1 ? 'item' : 'itens'}
            </span>
            <span>Ver carrinho</span>
            <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
          </button>
        </div>
      )}

      {/* MODAL DE PRODUTO */}
      {productModal && (
        <ProductModal
          product={productModal}
          onClose={() => setProductModal(null)}
          onAddToCart={(item) => {
            handleAddToCart(item)
            setProductModal(null)
          }}
        />
      )}

      {/* CARRINHO */}
{cartOpen && (
  <CartDrawer
    cart={cart}
    settings={settings}
    tableNumber={tableNumber}  // adicionar
    onClose={() => setCartOpen(false)}
    onRemove={handleRemoveFromCart}
    onClear={handleClearCart}
    onOrderPlaced={(code) => {
      setCart([])
      setCartOpen(false)
    }}
  />
)}
    </div>
  )
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '0.4rem 1rem', borderRadius: '20px', border: '1px solid',
      borderColor: active ? '#dc2626' : '#1f1f1f',
      backgroundColor: active ? '#dc2626' : 'transparent',
      color: active ? 'white' : '#a1a1aa',
      cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap',
      fontWeight: active ? '600' : '400', flexShrink: 0,
    }}>
      {label}
    </button>
  )
}

function ProductCard({ product, onClick }: { product: Product; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: '#141414', border: '1px solid #1f1f1f',
        borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#dc2626')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#1f1f1f')}
    >
      {/* Imagem */}
      <div style={{ height: '100px', backgroundColor: '#0a0a0a', overflow: 'hidden' }}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
            🍽️
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '0.5rem' }}>
        <p style={{ color: '#fafafa', fontSize: '0.75rem', fontWeight: '600', marginBottom: '2px', lineHeight: 1.2 }}>
          {product.name}
        </p>
        {product.description && (
          <p style={{ color: '#a1a1aa', fontSize: '0.65rem', marginBottom: '4px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#dc2626', fontSize: '0.8rem', fontWeight: '700' }}>
            R$ {product.price.toFixed(2).replace('.', ',')}
          </span>
          <div style={{ width: '22px', height: '22px', backgroundColor: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: '700' }}>
            +
          </div>
        </div>
      </div>
    </div>
  )
}