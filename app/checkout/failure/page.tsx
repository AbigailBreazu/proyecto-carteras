'use client'

import Link from 'next/link'
import styles from '../result.module.css'

export default function FailurePage() {
  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles.failure}`}>
        <div className={styles.icon}>❌</div>
        <h1 className={styles.title}>Pago Rechazado</h1>
        <p className={styles.message}>
          Tu pago no pudo ser procesado. 
          Por favor, verifica los datos de tu tarjeta e intenta nuevamente.
        </p>
        <p className={styles.message}>
          Si el problema persiste, contacta con tu banco o prueba con otro método de pago.
        </p>
        <Link href="/carrito" className={styles.button}>
          Volver al carrito
        </Link>
      </div>
    </div>
  )
}
