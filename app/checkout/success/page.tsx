'use client'

import { useEffect } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'
import styles from '../result.module.css'

export default function SuccessPage() {
  const { clearCart } = useCart()
  const router = useRouter()

  useEffect(() => {
    // Limpiar el carrito cuando el pago es exitoso
    clearCart()
    
    // Redirigir a mis compras después de 3 segundos
    const timer = setTimeout(() => {
      router.push('/mis-compras')
    }, 3000)

    return () => clearTimeout(timer)
  }, [clearCart, router])

  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles.success}`}>
        <div className={styles.icon}>✅</div>
        <h1 className={styles.title}>¡Pago Exitoso!</h1>
        <p className={styles.message}>
          Tu compra ha sido procesada correctamente. 
          Recibirás un email de confirmación con los detalles de tu pedido.
        </p>
        <p className={styles.message}>
          Redirigiendo a tus compras en 3 segundos...
        </p>
      </div>
    </div>
  )
}
