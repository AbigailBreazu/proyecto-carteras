'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './productos.module.css'
import Toast from '@/components/Toast'

interface Producto {
  id: string
  nombre: string
  tipo: string
  tamaño: string
  descripcion: string
  precio: number
  stock: number
  imagenes: string[]
}

export default function ProductosAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<string>('todos')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || session.user.role !== 'admin') {
      router.push('/login')
      return
    }

    fetchProductos()
  }, [session, status, router])

  const fetchProductos = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
      const res = await fetch(`${backendUrl}/api/productos`)
      
      if (!res.ok) {
        setError('Error al cargar productos')
        setLoading(false)
        return
      }

      const data = await res.json()
      console.log('📦 Productos recibidos:', data)
      
      // El backend devuelve { productos: { productos: [...], total, pagina, limite } }
      let productosArray = []
      if (data.productos && Array.isArray(data.productos.productos)) {
        productosArray = data.productos.productos
      } else if (data.productos && Array.isArray(data.productos)) {
        productosArray = data.productos
      } else if (Array.isArray(data)) {
        productosArray = data
      }
      
      console.log('✅ Array de productos:', productosArray)
      console.log('🔍 Primer producto ejemplo:', productosArray[0])
      setProductos(productosArray)
      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setError('Error de conexión')
      setLoading(false)
    }
  }

  const deleteProducto = async (id: string) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
      const res = await fetch(`${backendUrl}/api/admin/productos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      })

      if (res.ok) {
        setProductos(productos.filter(p => p.id !== id))
        setShowDeleteConfirm(null)
        setToast({ message: '¡Producto eliminado exitosamente!', type: 'success' })
      } else {
        setToast({ message: 'Error al eliminar el producto', type: 'error' })
      }
    } catch (err) {
      console.error('Error:', err)
      setToast({ message: 'Error de conexión', type: 'error' })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando...</div>
      </div>
    )
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  const productosFiltrados = filtroTipo === 'todos' 
    ? productos 
    : productos.filter(p => {
        // Manejar tanto "tipo" como "categoria"
        const tipoProducto = p.tipo || (p as any).categoria
        return tipoProducto === filtroTipo
      })

  const stats = {
    total: productos.length,
    carteras: productos.filter(p => (p.tipo || (p as any).categoria) === 'cartera').length,
    rinoneras: productos.filter(p => (p.tipo || (p as any).categoria) === 'rinonera').length,
    materas: productos.filter(p => (p.tipo || (p as any).categoria) === 'matera').length,
    combos: productos.filter(p => (p.tipo || (p as any).categoria) === 'combo').length,
    mochilas: productos.filter(p => (p.tipo || (p as any).categoria) === 'mochila').length,
    neceser_pileta: productos.filter(p => (p.tipo || (p as any).categoria) === 'neceser_pileta').length,
    neceser_higiene: productos.filter(p => (p.tipo || (p as any).categoria) === 'neceser_higiene').length,
    mantel_camping: productos.filter(p => (p.tipo || (p as any).categoria) === 'mantel_camping').length,
    bolso_camping: productos.filter(p => (p.tipo || (p as any).categoria) === 'bolso_camping').length,
    lonchera_termica: productos.filter(p => (p.tipo || (p as any).categoria) === 'lonchera_termica').length,
    mochilas_pequenas: productos.filter(p => (p.tipo || (p as any).categoria) === 'mochilas_pequenas').length,
    kit_dormir: productos.filter(p => (p.tipo || (p as any).categoria) === 'kit_dormir').length,
    otros: productos.filter(p => (p.tipo || (p as any).categoria) === 'otros').length
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>📦 Productos Disponibles</h1>
          <p className={styles.subtitle}>Gestiona tu catálogo de productos</p>
        </div>
        <Link href="/admin/productos/nuevo" className={styles.btnAdd}>
          ➕ Agregar Producto
        </Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Filtros */}
      <div className={styles.filters}>
        <button 
          className={`${styles.filterBtn} ${filtroTipo === 'todos' ? styles.active : ''}`}
          onClick={() => setFiltroTipo('todos')}
        >
          Todos ({stats.total})
        </button>
        <button 
          className={`${styles.filterBtn} ${filtroTipo === 'cartera' ? styles.active : ''}`}
          onClick={() => setFiltroTipo('cartera')}
        >
          Carteras ({stats.carteras})
        </button>
        <button 
          className={`${styles.filterBtn} ${filtroTipo === 'rinonera' ? styles.active : ''}`}
          onClick={() => setFiltroTipo('rinonera')}
        >
          Riñoneras ({stats.rinoneras})
        </button>
        <button 
          className={`${styles.filterBtn} ${filtroTipo === 'matera' ? styles.active : ''}`}
          onClick={() => setFiltroTipo('matera')}
        >
          Materas ({stats.materas})
        </button>
        <button 
          className={`${styles.filterBtn} ${filtroTipo === 'combo' ? styles.active : ''}`}
          onClick={() => setFiltroTipo('combo')}
        >
          Combos ({stats.combos})
        </button>
        <button 
          className={`${styles.filterBtn} ${filtroTipo === 'mochila' ? styles.active : ''}`}
          onClick={() => setFiltroTipo('mochila')}
        >
          Mochilas ({stats.mochilas})
        </button>
        <button 
          className={`${styles.filterBtn} ${filtroTipo === 'neceser_pileta' ? styles.active : ''}`}
          onClick={() => setFiltroTipo('neceser_pileta')}
        >
          Neceser Pileta ({stats.neceser_pileta})
        </button>
        <button 
          className={`${styles.filterBtn} ${filtroTipo === 'neceser_higiene' ? styles.active : ''}`}
          onClick={() => setFiltroTipo('neceser_higiene')}
        >
          Neceser Higiene ({stats.neceser_higiene})
        </button>
        <button 
          className={`${styles.filterBtn} ${filtroTipo === 'mantel_camping' ? styles.active : ''}`}
          onClick={() => setFiltroTipo('mantel_camping')}
        >
          Mantel Camping ({stats.mantel_camping})
        </button>
        <button 
          className={`${styles.filterBtn} ${filtroTipo === 'bolso_camping' ? styles.active : ''}`}
          onClick={() => setFiltroTipo('bolso_camping')}
        >
          Bolso Camping ({stats.bolso_camping})
        </button>
        <button 
          className={`${styles.filterBtn} ${filtroTipo === 'lonchera_termica' ? styles.active : ''}`}
          onClick={() => setFiltroTipo('lonchera_termica')}
        >
          Lonchera Térmica ({stats.lonchera_termica})
        </button>
        <button 
          className={`${styles.filterBtn} ${filtroTipo === 'mochilas_pequenas' ? styles.active : ''}`}
          onClick={() => setFiltroTipo('mochilas_pequenas')}
        >
          Mochilas Pequeñas ({stats.mochilas_pequenas})
        </button>
        <button 
          className={`${styles.filterBtn} ${filtroTipo === 'kit_dormir' ? styles.active : ''}`}
          onClick={() => setFiltroTipo('kit_dormir')}
        >
          Kit Dormir ({stats.kit_dormir})
        </button>
        <button 
          className={`${styles.filterBtn} ${filtroTipo === 'otros' ? styles.active : ''}`}
          onClick={() => setFiltroTipo('otros')}
        >
          Otros ({stats.otros})
        </button>
      </div>

      {/* Lista de productos */}
      {productosFiltrados.length === 0 ? (
        <div className={styles.empty}>
          <p>📦 No hay productos disponibles</p>
          <Link href="/admin/productos/nuevo" className={styles.btnAdd}>
            Agregar el primero
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {productosFiltrados.map(producto => {
            // Manejar tanto "imagen" (singular) como "imagenes" (plural)
            let imagenes = producto.imagenes || (producto.imagen ? [producto.imagen] : [])
            
            // Parsear imagenes si es un string JSON
            if (typeof imagenes === 'string') {
              try {
                imagenes = JSON.parse(imagenes)
              } catch (e) {
                imagenes = []
              }
            }
            
            const primeraImagen = Array.isArray(imagenes) && imagenes.length > 0 ? imagenes[0] : null
            
            // Verificar si es nuevo (menos de 7 días)
            const fechaCreacion = new Date(producto.createdAt || producto.created_at)
            const hoy = new Date()
            const diasDesdeCreacion = Math.floor((hoy.getTime() - fechaCreacion.getTime()) / (1000 * 60 * 60 * 24))
            const esNuevo = diasDesdeCreacion < 7
            
            return (
              <div key={producto.id} className={styles.card}>
                <div className={styles.imageContainer}>
                  {primeraImagen ? (
                    <img 
                      src={primeraImagen.startsWith('http') 
                        ? primeraImagen 
                        : `http://localhost:3000${primeraImagen}`
                      }
                      alt={producto.nombre}
                      className={styles.image}
                      onError={(e) => {
                        console.error('Error cargando imagen:', primeraImagen)
                        e.currentTarget.src = '/placeholder.png'
                      }}
                    />
                  ) : (
                    <div className={styles.noImage}>Sin imagen</div>
                  )}
                  <div className={styles.badge}>{producto.tipo || producto.categoria}</div>
                  {esNuevo && <div className={styles.badgeNew}>NUEVO</div>}
                </div>
              
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{producto.nombre}</h3>
                <p className={styles.cardSize}>{producto.tamaño}</p>
                <div className={styles.cardPrice}>
                  ${producto.precio.toLocaleString('es-AR')}
                </div>
                <div className={styles.cardStock}>
                  Stock: <strong>{producto.stock}</strong>
                </div>
              </div>

              <div className={styles.cardActions}>
                <Link 
                  href={`/admin/productos/${producto.id}`}
                  className={styles.btnView}
                >
                  👁️ Ver
                </Link>
                <Link 
                  href={`/admin/productos/editar/${producto.id}`}
                  className={styles.btnEdit}
                >
                  ✏️ Editar
                </Link>
                <button 
                  onClick={() => setShowDeleteConfirm(producto.id)}
                  className={styles.btnDelete}
                >
                  🗑️
                </button>
              </div>
            </div>
          )
        })}
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>¿Eliminar producto?</h3>
            <p>Esta acción no se puede deshacer</p>
            <div className={styles.modalActions}>
              <button 
                onClick={() => setShowDeleteConfirm(null)}
                className={styles.btnCancel}
              >
                Cancelar
              </button>
              <button 
                onClick={() => deleteProducto(showDeleteConfirm)}
                className={styles.btnConfirm}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de notificación */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
