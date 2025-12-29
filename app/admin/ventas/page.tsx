'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import styles from './ventas.module.css'

interface ItemOrden {
  producto_id: string
  nombre: string
  cantidad: number
  precio_unitario: number
}

interface Comprobante {
  mercadopago_payment_id: string
  estado: string
  estado_detalle: string
  monto: number
  moneda: string
  metodo_pago: string
  tipo_pago: string
  fecha_aprobacion: string
  comprador_email: string
  comprador_nombre: string
  cuotas: number
}

interface Orden {
  id: string
  usuario_email: string
  items: ItemOrden[]
  total: number
  estado: string
  fecha_creacion: string
  mercadopago_payment_id?: string
  mercadopago_status?: string
  comprobante?: Comprobante
}

export default function VentasPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<Orden | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'admin') {
      router.push('/login')
      return
    }

    fetchOrdenes()
  }, [session, status, router])

  const fetchOrdenes = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
      const res = await fetch(`${backendUrl}/ordenes`)
      
      if (!res.ok) {
        setError('Error al cargar órdenes')
        setLoading(false)
        return
      }

      const data = await res.json()
      setOrdenes(data || [])
      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setError('Error de conexión')
      setLoading(false)
    }
  }

  const verDetalles = (orden: Orden) => {
    setOrdenSeleccionada(orden)
  }

  const cerrarModal = () => {
    setOrdenSeleccionada(null)
  }

  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando ventas...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const totalVentas = ordenes.reduce((sum, orden) => sum + Number(orden.total), 0)
  const ventasPagadas = ordenes.filter(o => o.estado?.toUpperCase() === 'PAGADO').length
  const ventasPendientes = ordenes.filter(o => o.estado?.toUpperCase() === 'PENDIENTE').length

  const ESTADOS: Record<string, { label: string; color: string }> = {
    PENDIENTE: { label: '⏳ Pendiente', color: '#ff9800' },
    PAGADO: { label: '✅ Pagado', color: '#4caf50' },
    PROCESANDO: { label: '📦 Procesando', color: '#2196f3' },
    ENVIADO: { label: '🚚 Enviado', color: '#9c27b0' },
    ENTREGADO: { label: '🎉 Entregado', color: '#276b31' },
    CANCELADO: { label: '❌ Cancelado', color: '#dc3545' }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>💰 Ventas - Carrito</h1>
          <p className={styles.subtitle}>Gestión de órdenes y comprobantes de pago</p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💵</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>${totalVentas.toLocaleString('es-AR')}</div>
            <div className={styles.statLabel}>Ventas Totales</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📦</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{ordenes.length}</div>
            <div className={styles.statLabel}>Total Órdenes</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{ventasPendientes}</div>
            <div className={styles.statLabel}>Pendientes</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{ventasPagadas}</div>
            <div className={styles.statLabel}>Pagadas</div>
          </div>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {ordenes.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay órdenes registradas todavía</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>N° Orden</th>
                <th>Cliente</th>
                <th>Items</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Pago MP</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((orden) => {
                const estadoInfo = ESTADOS[orden.estado?.toUpperCase()] || ESTADOS.PENDIENTE
                return (
                  <tr key={orden.id}>
                    <td className={styles.ordenId}>#{orden.id.slice(-8)}</td>
                    <td>{orden.usuario_email}</td>
                    <td>{orden.items?.length || 0} productos</td>
                    <td className={styles.total}>${Number(orden.total).toFixed(2)}</td>
                    <td>
                      <span className={styles.badge} style={{ backgroundColor: estadoInfo.color }}>
                        {estadoInfo.label}
                      </span>
                    </td>
                    <td>
                      {orden.mercadopago_payment_id ? (
                        <span className={styles.paymentId}>{orden.mercadopago_payment_id}</span>
                      ) : (
                        <span className={styles.noPago}>Sin pago</span>
                      )}
                    </td>
                    <td>{new Date(orden.fecha_creacion).toLocaleDateString('es-AR')}</td>
                    <td>
                      <button onClick={() => verDetalles(orden)} className={styles.btnVer}>
                        👁️ Ver
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de detalles */}
      {ordenSeleccionada && (
        <div className={styles.modal} onClick={cerrarModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Detalles de Orden #{ordenSeleccionada.id.slice(-8)}</h2>
              <button onClick={cerrarModal} className={styles.btnCerrar}>✕</button>
            </div>
            
            <div className={styles.modalBody}>
              {/* Información del cliente */}
              <div className={styles.section}>
                <h3>👤 Cliente</h3>
                <p><strong>Email:</strong> {ordenSeleccionada.usuario_email}</p>
                <p><strong>Fecha:</strong> {new Date(ordenSeleccionada.fecha_creacion).toLocaleString('es-AR')}</p>
              </div>

              {/* Productos */}
              <div className={styles.section}>
                <h3>📦 Productos</h3>
                <div className={styles.itemsList}>
                  {ordenSeleccionada.items?.map((item, idx) => (
                    <div key={idx} className={styles.itemRow}>
                      <span>{item.nombre}</span>
                      <span>x{item.cantidad}</span>
                      <span>${(item.precio_unitario * item.cantidad).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.totalRow}>
                  <strong>Total:</strong>
                  <strong>${ordenSeleccionada.total.toFixed(2)}</strong>
                </div>
              </div>

              {/* Comprobante de Mercado Pago */}
              {ordenSeleccionada.comprobante ? (
                <div className={styles.section}>
                  <h3>💳 Comprobante de Pago</h3>
                  <div className={styles.comprobante}>
                    <div className={styles.comprobanteRow}>
                      <span>ID de Pago:</span>
                      <strong>{ordenSeleccionada.comprobante.mercadopago_payment_id}</strong>
                    </div>
                    <div className={styles.comprobanteRow}>
                      <span>Estado:</span>
                      <span className={styles.badge} style={{ 
                        backgroundColor: ordenSeleccionada.comprobante.estado === 'approved' ? '#4caf50' : '#ff9800' 
                      }}>
                        {ordenSeleccionada.comprobante.estado}
                      </span>
                    </div>
                    <div className={styles.comprobanteRow}>
                      <span>Detalle:</span>
                      <span>{ordenSeleccionada.comprobante.estado_detalle}</span>
                    </div>
                    <div className={styles.comprobanteRow}>
                      <span>Monto:</span>
                      <strong>{ordenSeleccionada.comprobante.moneda} ${ordenSeleccionada.comprobante.monto}</strong>
                    </div>
                    <div className={styles.comprobanteRow}>
                      <span>Método:</span>
                      <span>{ordenSeleccionada.comprobante.metodo_pago} ({ordenSeleccionada.comprobante.tipo_pago})</span>
                    </div>
                    <div className={styles.comprobanteRow}>
                      <span>Cuotas:</span>
                      <span>{ordenSeleccionada.comprobante.cuotas}x</span>
                    </div>
                    <div className={styles.comprobanteRow}>
                      <span>Pagador:</span>
                      <span>{ordenSeleccionada.comprobante.comprador_nombre}</span>
                    </div>
                    <div className={styles.comprobanteRow}>
                      <span>Email:</span>
                      <span>{ordenSeleccionada.comprobante.comprador_email}</span>
                    </div>
                    <div className={styles.comprobanteRow}>
                      <span>Fecha Aprobación:</span>
                      <span>{new Date(ordenSeleccionada.comprobante.fecha_aprobacion).toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.section}>
                  <h3>💳 Comprobante de Pago</h3>
                  <p className={styles.noComprobante}>
                    {ordenSeleccionada.mercadopago_payment_id ? 
                      '⏳ Esperando webhook de Mercado Pago...' : 
                      '❌ Orden sin pago registrado'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
