'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import styles from './producto-admin.module.css'

interface Producto {
  id: string
  nombre: string
  tipo: string
  tamaño: string
  descripcion: string
  precio: number
  stock: number
  imagenes: string[]
  material?: string
  color?: string
}

export default function AdminProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [producto, setProducto] = useState<Producto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [imagenActual, setImagenActual] = useState(0)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    const fetchProducto = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
        const res = await fetch(`${backendUrl}/api/productos/${id}`)
        
        if (!res.ok) {
          setError('Producto no encontrado')
          setLoading(false)
          return
        }

        const data = await res.json()
        setProducto(data.producto || data)
        setLoading(false)
      } catch (err) {
        console.error('Error:', err)
        setError('Error al cargar el producto')
        setLoading(false)
      }
    }

    if (id) {
      fetchProducto()
    }
  }, [id, session, status, router])

  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando producto...</div>
      </div>
    )
  }

  if (error || !producto) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>😕 {error || 'Producto no encontrado'}</h2>
          <Link href="/admin/productos" className={styles.backBtn}>
            ← Volver a productos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/admin">Admin</Link>
        <span>/</span>
        <Link href="/admin/productos">Productos</Link>
        <span>/</span>
        <span>{producto.nombre}</span>
      </div>

      <div className={styles.adminActions}>
        <Link href="/admin/productos" className={styles.btnBack}>
          ← Volver a lista
        </Link>
        <Link href={`/admin/productos/editar/${producto.id}`} className={styles.btnEdit}>
          ✏️ Editar Producto
        </Link>
      </div>

      <div className={styles.productGrid}>
        {/* Galería de imágenes */}
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            {producto.imagenes && producto.imagenes.length > 0 ? (
              <img 
                src={producto.imagenes[imagenActual].startsWith('http') 
                  ? producto.imagenes[imagenActual] 
                  : `http://localhost:3000${producto.imagenes[imagenActual]}`
                }
                alt={producto.nombre}
                className={styles.image}
              />
            ) : (
              <div className={styles.noImage}>Sin imagen</div>
            )}
          </div>
          
          {producto.imagenes && producto.imagenes.length > 1 && (
            <div className={styles.thumbnails}>
              {producto.imagenes.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setImagenActual(index)}
                  className={`${styles.thumbnail} ${imagenActual === index ? styles.active : ''}`}
                >
                  <img 
                    src={img.startsWith('http') ? img : `http://localhost:3000${img}`} 
                    alt={`${producto.nombre} ${index + 1}`} 
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className={styles.info}>
          <div className={styles.badge}>{producto.tipo}</div>
          <h1 className={styles.title}>{producto.nombre}</h1>
          
          <div className={styles.price}>
            ${producto.precio ? Number(producto.precio).toLocaleString('es-AR') : '0'}
          </div>

          <div className={styles.details}>
            <div className={styles.detailItem}>
              <strong>ID:</strong>
              <span className={styles.idText}>{producto.id}</span>
            </div>
            <div className={styles.detailItem}>
              <strong>Tamaño:</strong>
              <span>{producto.tamaño || 'N/A'}</span>
            </div>
            <div className={styles.detailItem}>
              <strong>Stock:</strong>
              <span className={producto.stock && producto.stock > 0 ? styles.inStock : styles.outStock}>
                {producto.stock && producto.stock > 0 ? `${producto.stock} disponibles` : 'Sin stock'}
              </span>
            </div>
            {producto.material && (
              <div className={styles.detailItem}>
                <strong>Material:</strong>
                <span>{producto.material}</span>
              </div>
            )}
            {producto.color && (
              <div className={styles.detailItem}>
                <strong>Color:</strong>
                <span>{producto.color}</span>
              </div>
            )}
          </div>

          <div className={styles.description}>
            <h3>Descripción</h3>
            <p>{producto.descripcion || 'Sin descripción'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
