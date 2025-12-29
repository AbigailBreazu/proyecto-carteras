'use client'

import Link from 'next/link'
import styles from '../result.module.css'

export default function PendingPage() {
  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles.pending}`}>
        <div className={styles.icon}>⏳</div>
        <h1 className={styles.title}>Pago Pendiente</h1>
        <p className={styles.message}>
          Tu pago está siendo procesado. 
          Recibirás un email cuando se confirme el pago.
        </p>
        <p className={styles.message}>
          Esto puede tardar unos minutos. Por favor, verifica tu email.
        </p>
        <Link href="/productos" className={styles.button}>
          Volver a la tienda
        </Link>
      </div>
    </div>
  )
}
