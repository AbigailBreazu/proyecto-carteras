'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import styles from './admin.module.css'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Redirigir si no está autenticado
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])



  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className={styles.container}>
      <div className={styles.welcomeSection}>
        <h1 className={styles.welcomeTitle}>👋 Bienvenido, {session.user.name}</h1>
        <p className={styles.welcomeText}>
          Panel de Administración de Datsusara
        </p>
        <div className={styles.adminBadge}>
          ✅ Administrador verificado
        </div>
        
        <div className={styles.quickActions}>
          <Link href="/admin/productos" className={styles.actionCard}>
            <div className={styles.actionIcon}>📦</div>
            <h3>Ver Productos</h3>
            <p>Gestionar catálogo completo</p>
          </Link>
          
          <Link href="/admin/productos/nuevo" className={styles.actionCard}>
            <div className={styles.actionIcon}>➕</div>
            <h3>Agregar Producto</h3>
            <p>Crear un nuevo producto en la tienda</p>
          </Link>

          <Link href="/admin/disenos-telas" className={styles.actionCard}>
            <div className={styles.actionIcon}>🎨</div>
            <h3>Diseños y Telas</h3>
            <p>Gestionar diseños base y telas disponibles</p>
          </Link>

          <Link href="/admin/pedidos-personalizados" className={styles.actionCard}>
            <div className={styles.actionIcon}>📋</div>
            <h3>Pedidos Personalizados</h3>
            <p>Administrar solicitudes de personalización</p>
          </Link>

          <Link href="/admin/solicitudes-modificacion" className={styles.actionCard}>
            <div className={styles.actionIcon}>✏️</div>
            <h3>Solicitudes de Modificación</h3>
            <p>Aprobar o rechazar cambios en pedidos</p>
          </Link>

          <Link href="/admin/ventas" className={styles.actionCard}>
            <div className={styles.actionIcon}>💰</div>
            <h3>Ventas</h3>
            <p>Ver historial de ventas</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
