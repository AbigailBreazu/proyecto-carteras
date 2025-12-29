'use client'

import { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProductCarousel from './ProductCarousel'
import { IProduct } from '@/types/product'
import styles from './ProductDetail.module.css'

interface ProductDetailProps {
  product: IProduct
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const { addToCart } = useCart()
  const router = useRouter()
  const [added, setAdded] = useState(false)

  console.log('🔍 ProductDetail renderizado con producto:', product)
  console.log('🔍 addToCart function:', typeof addToCart)

  const productImages = product.imagenes && product.imagenes.length > 0 
    ? product.imagenes 
    : [product.imagen]

  const handleAddToCart = () => {
    console.log('🛒 Producto original:', product)
    console.log('🛒 Intentando agregar al carrito')
    
    try {
      addToCart(product)
      console.log('✅ Producto agregado exitosamente')
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } catch (error) {
      console.error('❌ Error al agregar:', error)
    }
  }

  const handleBuyNow = () => {
    console.log('🛒 Comprando ahora:', product)
    
    try {
      addToCart(product)
      console.log('✅ Producto agregado, redirigiendo...')
      router.push('/carrito')
    } catch (error) {
      console.error('❌ Error al comprar:', error)
    }
  }

  console.log('🔍 handleAddToCart function:', typeof handleAddToCart)

  return (
    <div className={styles.container}>
      <Link href="/productos" className={styles.backButton}>
        ← Volver a productos
      </Link>

      <div className={styles.productDetail}>
        {/* Sección del carrusel */}
        <div className={styles.carouselSection}>
          <ProductCarousel 
            images={productImages} 
            productName={product.nombre}
          />
        </div>

        {/* Sección de información */}
        <div className={styles.infoSection}>
          <span className={styles.tipo}>{product.tipo}</span>
          
          <h1 className={styles.title}>{product.nombre}</h1>

          <p className={styles.price}>
            ${product.precio.toLocaleString('es-AR')}
          </p>

          <p className={styles.description}>
            {product.descripcion}
          </p>

          <div className={styles.size}>
            📏 <strong>Tamaño:</strong> {product.tamaño}
          </div>

          <div className={styles.actions}>
            <button 
              className={`${styles.addButton} ${added ? styles.added : ''}`}
              onClick={handleAddToCart}
            >
              {added ? (
                <>
                  <span>✓</span> Agregado al carrito
                </>
              ) : (
                <>
                  <span>🛒</span> Agregar al carrito
                </>
              )}
            </button>

            <button 
              className={styles.buyButton}
              onClick={handleBuyNow}
            >
              Comprar ahora
            </button>
          </div>

          {/* Características del producto */}
          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>✨</span>
              <span className={styles.featureText}>Hecho a mano con amor</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🚚</span>
              <span className={styles.featureText}>Envío a todo el país</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>💳</span>
              <span className={styles.featureText}>Pago seguro con Mercado Pago</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>📞</span>
              <span className={styles.featureText}>Atención personalizada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
