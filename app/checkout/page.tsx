'use client'

import { useCart } from '@/contexts/CartContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import styles from './checkout.module.css'

export default function CheckoutPage() {
  const { cart, getTotalPrice, getTotalItems } = useCart()
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  })

  useEffect(() => {
    if (cart.length === 0) {
      router.push('/carrito')
    }
  }, [cart, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validar campos
      if (!formData.name || !formData.email || !formData.phone) {
        setError('Por favor completa todos los campos')
        setLoading(false)
        return
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

      console.log('🛒 Iniciando checkout...');
      console.log('📦 Carrito:', cart);
      console.log('👤 Usuario autenticado:', session?.user?.email);

      // 1. Crear la orden en el backend
      const ordenData = {
        items: cart.map(item => ({
          producto_id: item.id,
          cantidad: item.quantity,
          precio_unitario: Number(item.precio)
        })),
        datos_cliente: {
          nombre: formData.name,
          email: formData.email,
          telefono: formData.phone
        }
      }

      console.log('📤 Enviando orden al backend:', ordenData);

      const ordenRes = await fetch(`${backendUrl}/ordenes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ordenData),
      })

      console.log('📥 Respuesta del backend:', ordenRes.status, ordenRes.statusText);

      const ordenResult = await ordenRes.json()
      console.log('📋 Resultado:', ordenResult);

      if (!ordenRes.ok) {
        console.error('❌ Error en orden:', ordenResult);
        throw new Error(ordenResult.message || 'Error al crear la orden')
      }

      console.log('✅ Orden creada exitosamente');

      // 2. Crear preferencia de pago en Mercado Pago
      console.log('💳 Creando preferencia de Mercado Pago...');
      
      const response = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            ...item,
            precio: Number(item.precio)
          })),
          payer: formData,
          external_reference: ordenResult.orden?.id?.toString() || ordenResult.id?.toString(),
        }),
      })

      console.log('📥 Respuesta Mercado Pago:', response.status);

      const data = await response.json()
      console.log('📋 Data Mercado Pago:', data);

      if (!response.ok) {
        console.error('❌ Error Mercado Pago:', data);
        throw new Error(data.error || 'Error al crear preferencia de pago')
      }

      console.log('✅ Redirigiendo a Mercado Pago...');
      // 3. Redirigir a Mercado Pago
      window.location.href = data.init_point

    } catch (err: any) {
      console.error('💥 Error en checkout:', err)
      setError(err.message || 'Error al procesar el pago')
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return null
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Finalizar Compra</h1>

      <div className={styles.checkoutCard}>
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Información de Contacto</h2>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Nombre completo *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Juan Pérez"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="juan@ejemplo.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone">Teléfono *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="1234567890"
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Resumen del Pedido</h2>
            <div className={styles.orderSummary}>
              {cart.map((item) => (
                <div key={item.id} className={styles.summaryItem}>
                  <span>{item.nombre} x {item.quantity}</span>
                  <span>${(item.precio * item.quantity).toLocaleString('es-AR')}</span>
                </div>
              ))}

              <div className={styles.summaryItem}>
                <span>Total de items</span>
                <span>{getTotalItems()}</span>
              </div>

              <div className={`${styles.summaryItem} ${styles.total}`}>
                <span>Total a Pagar</span>
                <span>${getTotalPrice().toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={styles.payButton}
            disabled={loading}
          >
            {loading ? (
              'Procesando...'
            ) : (
              <>
                <span>💳</span>
                Pagar con Mercado Pago
              </>
            )}
          </button>

          <Link href="/carrito" className={styles.backLink}>
            Volver al carrito
          </Link>
        </form>
      </div>
    </div>
  )
}
