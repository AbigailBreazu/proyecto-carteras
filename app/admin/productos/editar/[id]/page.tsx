'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Toast from '@/components/Toast'
import styles from './editar.module.css'

interface Producto {
  id: number
  nombre: string
  tipo: string
  precio: number
  stock: number
  descripcion?: string
  color?: string
  material?: string
  imagenes: string[]
}

export default function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [producto, setProducto] = useState<Producto | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'cartera',
    tamaño: '',
    precio: '',
    stock: '',
    descripcion: '',
    color: '',
    material: ''
  })
  const [imagenesActuales, setImagenesActuales] = useState<string[]>([])
  const [nuevasImagenes, setNuevasImagenes] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'info'
    duration?: number
  }>({ show: false, message: '', type: 'success' })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    loadProducto()
  }, [session, status, resolvedParams.id])

  const loadProducto = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
      console.log('🔍 Cargando producto:', resolvedParams.id)
      console.log('🌐 URL:', `${backendUrl}/api/productos/${resolvedParams.id}`)
      
      const res = await fetch(`${backendUrl}/api/productos/${resolvedParams.id}`)
      console.log('📡 Status:', res.status)
      console.log('📡 Status OK:', res.ok)
      
      const data = await res.json()
      console.log('📦 Respuesta completa del servidor:', JSON.stringify(data, null, 2))
      console.log('📦 Tipo de data:', typeof data)
      console.log('📦 Keys de data:', Object.keys(data))
      console.log('📦 data.producto existe?', !!data.producto)
      
      // El backend puede devolver el producto directamente o dentro de { producto: {...} }
      const prod = data.producto || data
      
      if (res.ok && prod && prod.id) {
        console.log('✅ Producto cargado:', prod)
        setProducto(prod)
        
        // Manejar imagenes que puede venir como "imagen" o "imagenes"
        const imagenes = prod.imagenes || (prod.imagen ? [prod.imagen] : [])
        
        setFormData({
          nombre: prod.nombre || '',
          tipo: prod.tipo || prod.categoria || 'cartera',
          tamaño: prod.tamaño || '',
          precio: prod.precio?.toString() || '0',
          stock: prod.stock?.toString() || '0',
          descripcion: prod.descripcion || '',
          color: prod.color || '',
          material: prod.material || ''
        })
        setImagenesActuales(imagenes)
        setLoading(false)
      } else {
        console.error('❌ Error: producto no tiene ID o respuesta inválida')
        console.error('❌ Data recibida:', data)
        setError('Producto no encontrado')
        setLoading(false)
      }
    } catch (err) {
      console.error('❌ Error al cargar producto:', err)
      setError('Error de conexión')
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newFiles = Array.from(files)
    setNuevasImagenes(prev => [...prev, ...newFiles])

    // Crear previews
    newFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const eliminarImagenActual = (url: string) => {
    setImagenesActuales(prev => prev.filter(img => img !== url))
  }

  const eliminarNuevaImagen = (index: number) => {
    setNuevasImagenes(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
      let imagenesFinales = [...imagenesActuales]

      // Subir nuevas imágenes si hay
      if (nuevasImagenes.length > 0) {
        const formDataImg = new FormData()
        nuevasImagenes.forEach(file => {
          formDataImg.append('files', file)
        })

        const uploadRes = await fetch(`${backendUrl}/upload/images`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`
          },
          body: formDataImg
        })

        const uploadData = await uploadRes.json()
        if (uploadRes.ok && uploadData.urls) {
          imagenesFinales = [...imagenesFinales, ...uploadData.urls]
        }
      }

      // Parsear precio (acepta puntos como separador de miles)
      const precioStr = formData.precio.replace(/\./g, '')
      const precio = parseFloat(precioStr)

      // Actualizar producto
      const productoData = {
        nombre: formData.nombre,
        tipo: formData.tipo,
        tamaño: formData.tamaño,
        precio: precio,
        stock: parseInt(formData.stock),
        descripcion: formData.descripcion,
        color: formData.color,
        material: formData.material,
        imagenes: imagenesFinales
      }

      const res = await fetch(`${backendUrl}/api/admin/productos/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(productoData)
      })

      if (res.ok) {
        setToast({
          show: true,
          message: '✅ Producto actualizado exitosamente',
          type: 'success',
          duration: 3000
        })
        setTimeout(() => {
          router.push('/admin/productos')
        }, 3000)
      } else {
        const errorData = await res.json()
        setToast({
          show: true,
          message: errorData.message || 'Error al actualizar el producto',
          type: 'error',
          duration: 5000
        })
        setError(errorData.message || 'Error al actualizar el producto')
      }
    } catch (err) {
      console.error('Error:', err)
      setToast({
        show: true,
        message: 'Error de conexión al actualizar el producto',
        type: 'error',
        duration: 5000
      })
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando producto...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Debes iniciar sesión</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
        <button onClick={() => router.push('/admin/productos')} className={styles.btnBack}>
          ← Volver a Productos
        </button>
      </div>
    )
  }

  if (!producto) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando datos del producto...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Editar Producto</h1>
        <button onClick={() => router.push('/admin')} className={styles.btnBack}>
          ← Volver al Panel
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="nombre">Nombre del Producto *</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="tipo">Tipo de Producto *</label>
            <select
              id="tipo"
              name="tipo"
              value={formData.tipo}
              onChange={handleInputChange}
              required
              className={styles.select}
            >
              <option value="cartera">Cartera</option>
              <option value="rinonera">Riñonera</option>
              <option value="matera">Matera</option>
              <option value="combo">Combo</option>
              <option value="mochila">Mochila</option>
              <option value="neceser_pileta">Neceser Pileta</option>
              <option value="neceser_higiene">Neceser Higiene</option>
              <option value="mantel_camping">Mantel Camping</option>
              <option value="bolso_camping">Bolso Camping</option>
              <option value="lonchera_termica">Lonchera Térmica</option>
              <option value="mochilas_pequenas">Mochilas Pequeñas</option>
              <option value="kit_dormir">Kit Dormir</option>
              <option value="otros">Otros</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="precio">Precio (ARS) *</label>
            <input
              type="text"
              id="precio"
              name="precio"
              value={formData.precio}
              onChange={handleInputChange}
              placeholder="25.000"
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="stock">Stock *</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleInputChange}
              min="0"
              required
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="color">Color</label>
            <input
              type="text"
              id="color"
              name="color"
              value={formData.color}
              onChange={handleInputChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="material">Material</label>
            <input
              type="text"
              id="material"
              name="material"
              value={formData.material}
              onChange={handleInputChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="tamaño">Tamaño (ej: 25 x 12 x 34)</label>
            <input
              type="text"
              id="tamaño"
              name="tamaño"
              value={formData.tamaño}
              onChange={handleInputChange}
              placeholder="25 x 12 x 34"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleInputChange}
            rows={4}
            className={styles.textarea}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Imágenes Actuales</label>
          <div className={styles.imagenesGrid}>
            {imagenesActuales.map((url, index) => (
              <div key={index} className={styles.imagenPreview}>
                <img src={url} alt={`Imagen ${index + 1}`} />
                <button
                  type="button"
                  onClick={() => eliminarImagenActual(url)}
                  className={styles.btnEliminar}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="imagenes">Agregar Nuevas Imágenes</label>
          <input
            type="file"
            id="imagenes"
            accept="image/*"
            multiple
            onChange={handleImagenChange}
            className={styles.fileInput}
          />
          <p className={styles.help}>Puedes seleccionar múltiples imágenes</p>
        </div>

        {previewUrls.length > 0 && (
          <div className={styles.formGroup}>
            <label>Nuevas Imágenes (Vista Previa)</label>
            <div className={styles.imagenesGrid}>
              {previewUrls.map((url, index) => (
                <div key={index} className={styles.imagenPreview}>
                  <img src={url} alt={`Nueva imagen ${index + 1}`} />
                  <button
                    type="button"
                    onClick={() => eliminarNuevaImagen(index)}
                    className={styles.btnEliminar}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className={styles.btnCancel}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.btnSubmit}
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Actualizar Producto'}
          </button>
        </div>
      </form>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </div>
  )
}
