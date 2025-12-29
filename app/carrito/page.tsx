'use client'

import { useCart } from '@/contexts/CartContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './carrito.module.css'

export default function CarritoPage() {
  const { cart, removeFromCart, updateQuantity, getTotalItems, getTotalPrice } = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    router.push('/checkout')
  }

  if (cart.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyCart}>
          <h2>Tu carrito está vacío</h2>
          <p>¡Agrega algunos productos para comenzar!</p>
          <Link href="/productos" className={styles.shopButton}>
            Ver productos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Carrito de Compras</h1>

      <div className={styles.cartContent}>
        <div className={styles.cartItems}>
          {cart.map((item) => {
            // Obtener la imagen correcta: usar el array de imágenes o la imagen principal
            const imagenProducto = item.imagenes && item.imagenes.length > 0 
              ? item.imagenes[0] 
              : item.imagen;
            
            // Si la URL es relativa, agregar el dominio del backend
            const imagenUrl = imagenProducto?.startsWith('http') 
              ? imagenProducto 
              : `http://localhost:3000${imagenProducto}`;

            return (
              <div key={item.id} className={styles.cartItem}>
                <img
                  src={imagenUrl}
                  alt={item.nombre}
                  width={120}
                  height={120}
                  className={styles.itemImage}
                />


              <div className={styles.itemDetails}>
                <h3 className={styles.itemName}>{item.nombre}</h3>
                <p className={styles.itemPrice}>
                  ${item.precio.toLocaleString('es-AR')}
                </p>

                <div className={styles.quantityControls}>
                  <button
                    className={styles.quantityButton}
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    −
                  </button>
                  <span className={styles.quantity}>{item.quantity}</span>
                  <button
                    className={styles.quantityButton}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className={styles.itemActions}>
                <p className={styles.itemTotal}>
                  ${(item.precio * item.quantity).toLocaleString('es-AR')}
                </p>
                <button
                  className={styles.removeButton}
                  onClick={() => removeFromCart(item.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
          })}
        </div>

        <div className={styles.summary}>
          <h2>Resumen de Compra</h2>

          <div className={styles.summaryRow}>
            <span>Subtotal ({getTotalItems()} items)</span>
            <span>${getTotalPrice().toLocaleString('es-AR')}</span>
          </div>

          <div className={styles.summaryRow}>
            <span>Envío</span>
            <span>A calcular</span>
          </div>

          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Total</span>
            <span>${getTotalPrice().toLocaleString('es-AR')}</span>
          </div>

          <button
            className={styles.checkoutButton}
            onClick={handleCheckout}
          >
            Proceder al Pago
          </button>

          <Link href="/productos" className={styles.continueShoppingLink}>
            Continuar comprando
          </Link>
        </div>
      </div>
    </div>
  )
}
