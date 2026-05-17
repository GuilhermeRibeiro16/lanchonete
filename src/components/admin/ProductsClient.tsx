'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from 'sonner'
import { deleteProduct, toggleProductAvailability, deleteCategory } from '@/lib/actions/products'
import { Product, Category } from '@/types'
import ProductModal from './ProductModal'
import CategoryModal from './CategoryModal'

interface Props {
  products: Product[]
  categories: Category[]
}

export default function ProductsClient({ products: initialProducts, categories: initialCategories }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [categories, setCategories] = useState(initialCategories)
  const [productModal, setProductModal] = useState<{ open: boolean; product?: Product }>({ open: false })
  const [categoryModal, setCategoryModal] = useState<{ open: boolean; category?: Category }>({ open: false })
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handleToggleAvailability(product: Product) {
    setLoadingId(product.id)
    try {
      await toggleProductAvailability(product.id, !product.available)
      setProducts(prev =>
        prev.map(p => p.id === product.id ? { ...p, available: !p.available } : p)
      )
      toast.success(product.available ? 'Produto indisponível' : 'Produto disponível')
    } catch {
      toast.error('Erro ao atualizar disponibilidade')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm('Deletar produto?')) return
    setLoadingId(id)
    try {
      await deleteProduct(id)
      setProducts(prev => prev.filter(p => p.id !== id))
      toast.success('Produto deletado')
    } catch {
      toast.error('Erro ao deletar produto')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Deletar categoria? Os produtos vinculados ficarão sem categoria.')) return
    try {
      await deleteCategory(id)
      setCategories(prev => prev.filter(c => c.id !== id))
      toast.success('Categoria deletada')
    } catch {
      toast.error('Erro ao deletar categoria')
    }
  }

  function handleProductSaved(product: Product, isNew: boolean) {
    if (isNew) {
      setProducts(prev => [...prev, product])
    } else {
      setProducts(prev => prev.map(p => p.id === product.id ? product : p))
    }
  }

  function handleCategorySaved(category: Category, isNew: boolean) {
    if (isNew) {
      setCategories(prev => [...prev, category])
    } else {
      setCategories(prev => prev.map(c => c.id === category.id ? category : c))
    }
  }

  const grouped = categories.map(cat => ({
    category: cat,
    products: products.filter(p => p.category_id === cat.id),
  }))

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <Tabs defaultValue="products">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <TabsList style={{ backgroundColor: '#141414', border: '1px solid #1f1f1f' }}>
            <TabsTrigger value="products" style={{ color: '#a1a1aa' }}>Produtos</TabsTrigger>
            <TabsTrigger value="categories" style={{ color: '#a1a1aa' }}>Categorias</TabsTrigger>
          </TabsList>
        </div>

        {/* ABA PRODUTOS */}
        <TabsContent value="products">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <Button
              onClick={() => setProductModal({ open: true })}
              style={{ backgroundColor: '#dc2626', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} /> Novo Produto
            </Button>
          </div>

          {grouped.map(({ category, products }) => (
            <div key={category.id} style={{ marginBottom: '2rem' }}>
              <h2 style={{ color: '#fafafa', fontSize: '1rem', fontWeight: '600', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #1f1f1f' }}>
                {category.name}
                <span style={{ color: '#a1a1aa', fontWeight: '400', fontSize: '0.875rem', marginLeft: '0.5rem' }}>
                  ({products.length})
                </span>
              </h2>

              {products.length === 0 && (
                <p style={{ color: '#3f3f3f', fontSize: '0.875rem' }}>Nenhum produto nessa categoria.</p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {products.map(product => (
                  <div
                    key={product.id}
                    style={{
                      backgroundColor: '#141414',
                      border: '1px solid #1f1f1f',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      opacity: product.available ? 1 : 0.5,
                    }}
                  >
                    {/* Imagem */}
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{ width: '56px', height: '56px', borderRadius: '8px', backgroundColor: '#1f1f1f', flexShrink: 0 }} />
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ color: '#fafafa', fontWeight: '600', fontSize: '0.9rem' }}>{product.name}</span>
                        <Badge style={{ backgroundColor: product.available ? '#166534' : '#7f1d1d', color: 'white', fontSize: '0.7rem' }}>
                          {product.available ? 'Disponível' : 'Indisponível'}
                        </Badge>
                      </div>
                      {product.description && (
                        <p style={{ color: '#a1a1aa', fontSize: '0.8rem', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {product.description}
                        </p>
                      )}
                      <p style={{ color: '#dc2626', fontWeight: '700', fontSize: '0.9rem', marginTop: '4px' }}>
                        R$ {product.price.toFixed(2).replace('.', ',')}
                      </p>
                    </div>

                    {/* Ações */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      <button
                        onClick={() => handleToggleAvailability(product)}
                        disabled={loadingId === product.id}
                        title={product.available ? 'Tornar indisponível' : 'Tornar disponível'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: product.available ? '#22c55e' : '#3f3f3f', padding: '4px' }}
                      >
                        {product.available ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                      </button>
                      <button
                        onClick={() => setProductModal({ open: true, product })}
                        title="Editar"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', padding: '4px' }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        disabled={loadingId === product.id}
                        title="Deletar"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ABA CATEGORIAS */}
        <TabsContent value="categories">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <Button
              onClick={() => setCategoryModal({ open: true })}
              style={{ backgroundColor: '#dc2626', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} /> Nova Categoria
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {categories.map(category => (
              <div
                key={category.id}
                style={{
                  backgroundColor: '#141414',
                  border: '1px solid #1f1f1f',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ color: '#fafafa', fontWeight: '600' }}>{category.name}</span>
                  <span style={{ color: '#a1a1aa', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                    ({products.filter(p => p.category_id === category.id).length} produtos)
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setCategoryModal({ open: true, category })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa', padding: '4px' }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAIS */}
      {productModal.open && (
        <ProductModal
          product={productModal.product}
          categories={categories}
          onClose={() => setProductModal({ open: false })}
          onSaved={handleProductSaved}
        />
      )}

      {categoryModal.open && (
        <CategoryModal
          category={categoryModal.category}
          onClose={() => setCategoryModal({ open: false })}
          onSaved={handleCategorySaved}
        />
      )}
    </div>
  )
}