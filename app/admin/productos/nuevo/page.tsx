'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Toast from '@/components/Toast'
import styles from './nuevo-producto.module.css'

export default function NuevoProductoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'cartera',
    tamaño: '',
    descripcion: '',
    precio: '',
    stock: '0',
    material: '',
    color: ''
  })
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    message: string
    type: 'success' | 'error' | 'info'
    duration?: number
    action?: { label: string; onClick: () => void }
  }>({ show: false, message: '', type: 'success' })
  const [createdProductId, setCreatedProductId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || [])
    
    // Combinar con archivos existentes
    const totalFiles = [...selectedFiles, ...newFiles]
    
    // Validar máximo 10 imágenes total
    if (totalFiles.length > 10) {
      setError(`Máximo 10 imágenes permitidas. Ya tienes ${selectedFiles.length}, intentas agregar ${newFiles.length}`)
      // Resetear el input
      e.target.value = ''
      return
    }

    // Validar tamaño de archivos (máx 5MB cada uno)
    const invalidFiles = newFiles.filter(file => file.size > 5 * 1024 * 1024)
    if (invalidFiles.length > 0) {
      setError('Cada imagen debe pesar menos de 5MB')
      e.target.value = ''
      return
    }

    // Validar tipos de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const invalidTypes = newFiles.filter(file => !validTypes.includes(file.type))
    if (invalidTypes.length > 0) {
      setError('Solo se permiten imágenes JPG, PNG, GIF o WEBP')
      e.target.value = ''
      return
    }

    setError('')
    setSelectedFiles(totalFiles)

    // Crear previews de las nuevas imágenes
    const newPreviews = newFiles.map(file => URL.createObjectURL(file))
    setImagePreviews([...imagePreviews, ...newPreviews])
    
    // Resetear el input para permitir seleccionar más archivos
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newPreviews = imagePreviews.filter((_, i) => i !== index)
    
    // Liberar URL del objeto
    URL.revokeObjectURL(imagePreviews[index])
    
    setSelectedFiles(newFiles)
    setImagePreviews(newPreviews)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validaciones básicas
    if (!formData.nombre || !formData.tamaño || !formData.descripcion || !formData.precio) {
      setError('Todos los campos son obligatorios')
      setLoading(false)
      return
    }

    // Limpiar el precio (remover puntos separadores de miles)
    const precioLimpio = formData.precio.replace(/\./g, '')
    const precioNumerico = parseFloat(precioLimpio)

    if (isNaN(precioNumerico) || precioNumerico <= 0) {
      setError('El precio debe ser un número válido mayor a 0')
      setLoading(false)
      return
    }

    // Validar que haya al menos una imagen
    if (selectedFiles.length === 0) {
      setError('Debes seleccionar al menos una imagen')
      setLoading(false)
      return
    }

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
      
      if (!session?.accessToken) {
        setError('No hay token de autenticación. Volvé a iniciar sesión.')
        setLoading(false)
        return
      }

      console.log('🔑 Session accessToken:', session.accessToken)
      console.log('👤 User role:', session.user?.role)
      console.log('📍 Upload URL:', `${backendUrl}/upload/images`)
      
      // 1. Primero subir las imágenes
      const formDataImages = new FormData()
      selectedFiles.forEach((file) => {
        formDataImages.append('images', file)
      })

      console.log('📤 Enviando', selectedFiles.length, 'imágenes con Authorization header')

      const uploadRes = await fetch(`${backendUrl}/upload/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: formDataImages,
      })

      console.log('📡 Upload response status:', uploadRes.status)
      const uploadData = await uploadRes.json()
      console.log('📦 Upload response data completa:', JSON.stringify(uploadData, null, 2))

      if (!uploadRes.ok) {
        setError(uploadData.message || `Error al subir las imágenes (${uploadRes.status})`)
        setLoading(false)
        return
      }

      // Verificar que tenemos las URLs
      const imageUrls = uploadData.urls || uploadData.files?.map((f: any) => f.url) || []
      console.log('🖼️ URLs de imágenes extraídas:', imageUrls)

      if (imageUrls.length === 0 || imageUrls.some((url: string) => !url || url.includes('undefined'))) {
        setError('Error: El backend no devolvió URLs válidas de imágenes')
        console.error('❌ URLs inválidas recibidas:', imageUrls)
        setLoading(false)
        return
      }

      // 2. Luego crear el producto con las URLs de las imágenes
      const precioLimpio = formData.precio.replace(/\./g, '')
      const precioNumerico = parseFloat(precioLimpio)

      const productData = {
        nombre: formData.nombre,
        tipo: formData.tipo,
        tamaño: formData.tamaño,
        descripcion: formData.descripcion,
        precio: precioNumerico,
        stock: parseInt(formData.stock),
        imagenes: imageUrls, // URLs validadas del backend
        material: formData.material,
        color: formData.color
      }

      console.log('📝 Datos del producto a enviar:', JSON.stringify(productData, null, 2))

      const res = await fetch(`${backendUrl}/api/admin/productos`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`
        },
        body: JSON.stringify(productData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Error al crear producto')
        setLoading(false)
        return
      }

      // Guardar el ID del producto creado
      setCreatedProductId(data.id)
      setLoading(false)

      // Primer toast: Confirmación (5 segundos)
      setToast({
        show: true,
        message: '¡Producto creado exitosamente!',
        type: 'success',
        duration: 5000
      })

      // Después de 5 segundos, mostrar el segundo toast con botón
      setTimeout(() => {
        setToast({
          show: true,
          message: '¿Querés ver cómo quedó el producto?',
          type: 'info',
          action: {
            label: 'Ir a Productos',
            onClick: () => {
              setToast({ show: false, message: '', type: 'success' })
              router.push('/admin/productos')
            }
          }
        })
      }, 5000)

    } catch (err) {
      console.error('Error:', err)
      setError('Error de conexión. Intenta nuevamente.')
      setLoading(false)
    }
  }

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
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
          action={toast.action}
        />
      )}
      
      <h1 className={styles.title}>📦 Agregar Nuevo Producto</h1>
      
      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Información Básica */}
        <div className={styles.formGroup}>
          <label htmlFor="nombre" className={styles.label}>
            Nombre del Producto <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            className={styles.input}
            placeholder="Ej: Cartera Clásica Elegante"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="tipo" className={styles.label}>
            Tipo <span className={styles.required}>*</span>
          </label>
          <select
            id="tipo"
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            className={styles.select}
            required
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
          <label htmlFor="tamaño" className={styles.label}>
            Tamaño <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            id="tamaño"
            name="tamaño"
            value={formData.tamaño}
            onChange={handleChange}
            className={styles.input}
            placeholder="Ej: Mediana (25x15x8 cm)"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="precio" className={styles.label}>
            Precio (ARS) <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            id="precio"
            name="precio"
            value={formData.precio}
            onChange={handleChange}
            className={styles.input}
            placeholder="Ej: 25000 o 25.000"
            required
          />
          <small style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px', display: 'block' }}>
            Puedes usar puntos como separador de miles: 25.000
          </small>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="stock" className={styles.label}>
            Stock Disponible <span className={styles.required}>*</span>
          </label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            className={styles.input}
            placeholder="0"
            min="0"
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="material" className={styles.label}>
            Material
          </label>
          <input
            type="text"
            id="material"
            name="material"
            value={formData.material}
            onChange={handleChange}
            className={styles.input}
            placeholder="Ej: Cuero sintético, Tela, etc."
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="color" className={styles.label}>
            Color
          </label>
          <input
            type="text"
            id="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            className={styles.input}
            placeholder="Ej: Negro, Marrón, Multicolor"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="descripcion" className={styles.label}>
            Descripción <span className={styles.required}>*</span>
          </label>
          <textarea
            id="descripcion"
            name="descripcion"
            value={formData.descripcion}
            onChange={handleChange}
            className={styles.textarea}
            placeholder="Describe el producto en detalle..."
            required
          />
        </div>

        {/* Sección de Subida de Imágenes */}
        <div className={styles.imageUploadSection}>
          <h2 className={styles.imageUploadTitle}>
            📸 Imágenes del Producto <span className={styles.required}>*</span>
          </h2>

          <div className={styles.formGroup}>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              multiple
              onChange={handleFileChange}
              className={styles.fileInput}
              id="imageUpload"
            />
          </div>

          {imagePreviews.length > 0 && (
            <>
              <div className={styles.imagePreviewGrid}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} className={styles.imagePreviewItem}>
                    <Image
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      fill
                      className={styles.imagePreview}
                      sizes="(max-width: 640px) 100px, 150px"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className={styles.removeImageButton}
                      title="Eliminar imagen"
                    >
                      ×
                    </button>
                    {index === 0 && (
                      <span className={styles.principalBadge}>Principal</span>
                    )}
                  </div>
                ))}
              </div>
              <div className={styles.imageCounter}>
                {imagePreviews.length} {imagePreviews.length === 1 ? 'imagen seleccionada' : 'imágenes seleccionadas'} (máx. 10)
              </div>
            </>
          )}

          <div className={styles.uploadNote}>
            <strong>📝 Nota importante:</strong>
            <ul>
              <li>Puedes seleccionar hasta 10 imágenes</li>
              <li>Formatos permitidos: JPG, PNG, GIF, WEBP</li>
              <li>Tamaño máximo por imagen: 5MB</li>
              <li>La primera imagen será la principal</li>
              <li>Se recomienda imágenes cuadradas para mejor visualización</li>
            </ul>
          </div>
        </div>

        {/* Botones de acción */}
        <div className={styles.buttonGroup}>
          <Link href="/admin" className={styles.cancelButton}>
            Cancelar
          </Link>
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading || selectedFiles.length === 0}
          >
            {loading ? (
              <span className={styles.loading}>
                <span className={styles.spinner}></span>
                Creando producto...
              </span>
            ) : (
              '✅ Crear Producto'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
