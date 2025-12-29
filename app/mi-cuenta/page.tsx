'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './mi-cuenta.module.css'

export default function MiCuentaPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<'perfil' | 'direcciones'>('perfil')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDireccionModal, setShowDireccionModal] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState<'success' | 'error'>('success')
  
  // Direcciones
  const [direcciones, setDirecciones] = useState<any[]>([])
  const [cargandoDirecciones, setCargandoDirecciones] = useState(false)
  const [metodoIngreso, setMetodoIngreso] = useState<'gps' | 'manual'>('gps')
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false)
  const [direccionEditando, setDireccionEditando] = useState<any>(null)
  
  // Formulario dirección
  const [formDireccion, setFormDireccion] = useState({
    alias: '',
    provincia: '',
    ciudad: '',
    codigoPostal: '',
    calle: '',
    numero: '',
    piso: '',
    departamento: '',
    referencias: '',
    latitud: null as number | null,
    longitud: null as number | null,
    esPrincipal: false
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }

    // Si es admin, redirigir al panel de administración
    if (session.user.role === 'admin') {
      router.push('/admin')
      return
    }

    // Cargar imagen de perfil desde el backend
    cargarPerfil()
    
    // Cargar direcciones si está en esa sección
    if (activeSection === 'direcciones') {
      cargarDirecciones()
    }
  }, [session, status, router, activeSection])

  const cargarPerfil = async () => {
    try {
      const response = await fetch('/api/users/me')
      if (response.ok) {
        const data = await response.json()
        if (data.profileImage) {
          setProfileImage(data.profileImage)
        }
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setMensaje('Por favor selecciona una imagen válida')
      setTipoMensaje('error')
      setTimeout(() => setMensaje(''), 3000)
      return
    }

    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMensaje('La imagen no puede superar los 5MB')
      setTipoMensaje('error')
      setTimeout(() => setMensaje(''), 3000)
      return
    }

    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/users/profile/image', {
        method: 'PUT',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        
        // Actualizar con timestamp para forzar recarga de la imagen
        const imageUrlWithTimestamp = `${data.profileImage}?t=${Date.now()}`
        setProfileImage(imageUrlWithTimestamp)
        
        // Actualizar la sesión para reflejar la nueva imagen
        await update()
        
        // Recargar el perfil completo
        await cargarPerfil()
        
        setMensaje('✅ Imagen de perfil actualizada')
        setTipoMensaje('success')
        setTimeout(() => setMensaje(''), 3000)
      } else {
        const error = await response.json()
        setMensaje('Error al subir imagen: ' + error.message)
        setTipoMensaje('error')
        setTimeout(() => setMensaje(''), 3000)
      }
    } catch (error) {
      console.error('Error al subir imagen:', error)
      setMensaje('Error al subir la imagen')
      setTipoMensaje('error')
      setTimeout(() => setMensaje(''), 3000)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSolicitarCambioPassword = async () => {
    if (!session?.user?.email) return

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: session.user.email })
      })

      if (response.ok) {
        setMensaje('✅ Te enviamos un email con las instrucciones para cambiar tu contraseña')
        setTipoMensaje('success')
        setShowPasswordModal(false)
      } else {
        const error = await response.json()
        setMensaje('Error: ' + error.message)
        setTipoMensaje('error')
      }
      
      setTimeout(() => setMensaje(''), 5000)
    } catch (error) {
      console.error('Error al solicitar cambio de contraseña:', error)
      setMensaje('Error al enviar el email')
      setTipoMensaje('error')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  // ========== FUNCIONES DIRECCIONES ==========
  
  const cargarDirecciones = async () => {
    setCargandoDirecciones(true)
    try {
      const response = await fetch('/api/users/direcciones')
      if (response.ok) {
        const data = await response.json()
        setDirecciones(data)
      }
    } catch (error) {
      console.error('Error al cargar direcciones:', error)
    } finally {
      setCargandoDirecciones(false)
    }
  }

  const obtenerUbicacionGPS = () => {
    if (!navigator.geolocation) {
      setMensaje('Tu navegador no soporta geolocalización')
      setTipoMensaje('error')
      setTimeout(() => setMensaje(''), 3000)
      return
    }

    setObteniendoUbicacion(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        
        // Intentar obtener dirección desde coordenadas usando API de geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=es`
          )
          const data = await response.json()
          
          const address = data.address || {}
          
          setFormDireccion(prev => ({
            ...prev,
            latitud: latitude,
            longitud: longitude,
            provincia: address.state || '',
            ciudad: address.city || address.town || address.village || '',
            codigoPostal: address.postcode || '',
            calle: address.road || '',
            numero: address.house_number || '',
            referencias: `Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }))
          
          setMensaje('✅ Ubicación obtenida correctamente')
          setTipoMensaje('success')
          setTimeout(() => setMensaje(''), 3000)
        } catch (error) {
          console.error('Error al geocodificar:', error)
          setFormDireccion(prev => ({
            ...prev,
            latitud: latitude,
            longitud: longitude,
            referencias: `Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }))
          setMensaje('⚠️ Ubicación obtenida, completa los datos manualmente')
          setTipoMensaje('success')
          setTimeout(() => setMensaje(''), 3000)
        } finally {
          setObteniendoUbicacion(false)
        }
      },
      (error) => {
        console.error('Error de geolocalización:', error)
        setMensaje('No se pudo obtener tu ubicación. Verifica los permisos.')
        setTipoMensaje('error')
        setTimeout(() => setMensaje(''), 3000)
        setObteniendoUbicacion(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const abrirModalDireccion = (direccion?: any) => {
    if (direccion) {
      setDireccionEditando(direccion)
      setFormDireccion(direccion)
    } else {
      setDireccionEditando(null)
      setFormDireccion({
        alias: '',
        provincia: '',
        ciudad: '',
        codigoPostal: '',
        calle: '',
        numero: '',
        piso: '',
        departamento: '',
        referencias: '',
        latitud: null,
        longitud: null,
        esPrincipal: false
      })
    }
    setShowDireccionModal(true)
  }

  const cerrarModalDireccion = () => {
    setShowDireccionModal(false)
    setDireccionEditando(null)
    setMetodoIngreso('gps')
    setFormDireccion({
      alias: '',
      provincia: '',
      ciudad: '',
      codigoPostal: '',
      calle: '',
      numero: '',
      piso: '',
      departamento: '',
      referencias: '',
      latitud: null,
      longitud: null,
      esPrincipal: false
    })
  }

  const guardarDireccion = async () => {
    // Validaciones
    if (!formDireccion.alias.trim()) {
      setMensaje('El alias es obligatorio')
      setTipoMensaje('error')
      setTimeout(() => setMensaje(''), 3000)
      return
    }

    if (!formDireccion.provincia || !formDireccion.ciudad || !formDireccion.calle) {
      setMensaje('Provincia, ciudad y calle son obligatorios')
      setTipoMensaje('error')
      setTimeout(() => setMensaje(''), 3000)
      return
    }

    try {
      const method = direccionEditando ? 'PUT' : 'POST'
      const url = direccionEditando 
        ? `/api/users/direcciones/${direccionEditando.id}`
        : '/api/users/direcciones'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formDireccion)
      })

      if (response.ok) {
        setMensaje(`✅ Dirección ${direccionEditando ? 'actualizada' : 'agregada'} correctamente`)
        setTipoMensaje('success')
        setTimeout(() => setMensaje(''), 3000)
        cerrarModalDireccion()
        cargarDirecciones()
      } else {
        const error = await response.json()
        setMensaje('Error: ' + error.message)
        setTipoMensaje('error')
        setTimeout(() => setMensaje(''), 3000)
      }
    } catch (error) {
      console.error('Error al guardar dirección:', error)
      setMensaje('Error al guardar dirección')
      setTipoMensaje('error')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const eliminarDireccion = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta dirección?')) return

    try {
      const response = await fetch(`/api/users/direcciones/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMensaje('✅ Dirección eliminada')
        setTipoMensaje('success')
        setTimeout(() => setMensaje(''), 3000)
        cargarDirecciones()
      } else {
        const error = await response.json()
        setMensaje('Error: ' + error.message)
        setTipoMensaje('error')
        setTimeout(() => setMensaje(''), 3000)
      }
    } catch (error) {
      console.error('Error al eliminar dirección:', error)
      setMensaje('Error al eliminar dirección')
      setTipoMensaje('error')
      setTimeout(() => setMensaje(''), 3000)
    }
  }

  const marcarComoPrincipal = async (id: string) => {
    try {
      const response = await fetch(`/api/users/direcciones/${id}/principal`, {
        method: 'PATCH'
      })

      if (response.ok) {
        setMensaje('✅ Dirección principal actualizada')
        setTipoMensaje('success')
        setTimeout(() => setMensaje(''), 3000)
        cargarDirecciones()
      }
    } catch (error) {
      console.error('Error al marcar como principal:', error)
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
      {mensaje && (
        <div className={`${styles.mensaje} ${styles[tipoMensaje]}`}>
          {mensaje}
        </div>
      )}

      <div className={styles.header}>
        <h1>🧵 Mi Cuenta</h1>
        <p>Bienvenido/a {session.user.name}</p>
      </div>

      {/* Tabs de navegación */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeSection === 'perfil' ? styles.tabActive : ''}`}
          onClick={() => setActiveSection('perfil')}
        >
          📋 Mi Perfil
        </button>
        <button 
          className={`${styles.tab} ${activeSection === 'direcciones' ? styles.tabActive : ''}`}
          onClick={() => setActiveSection('direcciones')}
        >
          📍 Mis Direcciones
        </button>
      </div>

      {/* Contenido de cada sección */}
      <div className={styles.content}>
        
        {/* Sección: Mi Perfil */}
        {activeSection === 'perfil' && (
          <div className={styles.section}>
            <h2>Información Personal</h2>
            
            {/* Imagen de Perfil */}
            <div className={styles.profileImageSection}>
              <div className={styles.profileImageContainer}>
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Foto de perfil" 
                    className={styles.profileImage}
                    key={profileImage}
                  />
                ) : (
                  <div className={styles.profileImagePlaceholder}>
                    <span>📷</span>
                  </div>
                )}
              </div>
              
              <div className={styles.uploadButtonContainer}>
                <label htmlFor="profileImageUpload" className={styles.btnSecondary}>
                  {uploadingImage ? '⏳ Subiendo...' : '📸 Cambiar foto'}
                </label>
                <input
                  id="profileImageUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  style={{ display: 'none' }}
                />
                <p className={styles.uploadHint}>JPG, PNG o GIF (máx. 5MB)</p>
              </div>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Nombre:</span>
                <span className={styles.infoValue}>{session.user.name}</span>
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Email:</span>
                <span className={styles.infoValue}>{session.user.email}</span>
              </div>
              
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Tipo de cuenta:</span>
                <span className={styles.badge}>Cliente</span>
              </div>
            </div>

            <div className={styles.actions}>
              <button 
                className={styles.btnSecondary}
                onClick={() => setShowPasswordModal(true)}
              >
                🔒 Cambiar Contraseña
              </button>
            </div>
          </div>
        )}

        {/* Sección: Mis Direcciones */}
        {activeSection === 'direcciones' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Direcciones de Envío</h2>
              <button 
                className={styles.btnPrimary}
                onClick={() => abrirModalDireccion()}
              >
                ➕ Agregar Dirección
              </button>
            </div>
            
            {cargandoDirecciones ? (
              <div className={styles.loading}>Cargando direcciones...</div>
            ) : direcciones.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📍</span>
                <p>No tienes direcciones guardadas</p>
              </div>
            ) : (
              <div className={styles.direccionesList}>
                {direcciones.map((direccion) => (
                  <div key={direccion.id} className={styles.direccionCard}>
                    <div className={styles.direccionHeader}>
                      <span className={styles.direccionTipo}>
                        {direccion.alias === 'Casa' ? '🏠' : direccion.alias === 'Trabajo' ? '💼' : '📍'} {direccion.alias}
                      </span>
                      {direccion.esPrincipal && (
                        <span className={styles.direccionPrincipal}>Principal</span>
                      )}
                    </div>
                    <div className={styles.direccionBody}>
                      <p><strong>{direccion.calle} {direccion.numero}</strong></p>
                      {(direccion.piso || direccion.departamento) && (
                        <p>Piso {direccion.piso} {direccion.departamento && `Depto. ${direccion.departamento}`}</p>
                      )}
                      <p>{direccion.ciudad}, {direccion.provincia}</p>
                      {direccion.codigoPostal && <p>CP: {direccion.codigoPostal}</p>}
                      {direccion.referencias && (
                        <p className={styles.referencias}>📝 {direccion.referencias}</p>
                      )}
                      {direccion.latitud && direccion.longitud && (
                        <p className={styles.coordenadas}>
                          📍 GPS: {Number(direccion.latitud).toFixed(6)}, {Number(direccion.longitud).toFixed(6)}
                        </p>
                      )}
                    </div>
                    <div className={styles.direccionActions}>
                      {!direccion.esPrincipal && (
                        <button 
                          className={styles.btnSecondary}
                          onClick={() => marcarComoPrincipal(direccion.id)}
                        >
                          ⭐ Marcar Principal
                        </button>
                      )}
                      <button 
                        className={styles.btnSecondary}
                        onClick={() => abrirModalDireccion(direccion)}
                      >
                        ✏️ Editar
                      </button>
                      <button 
                        className={styles.btnDanger}
                        onClick={() => eliminarDireccion(direccion.id)}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modal para cambiar contraseña */}
      {showPasswordModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>🔒 Cambiar Contraseña</h3>
              <button 
                className={styles.modalClose}
                onClick={() => setShowPasswordModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <p>Te enviaremos un email a <strong>{session?.user?.email}</strong> con un enlace para restablecer tu contraseña.</p>
              <p className={styles.modalWarning}>⚠️ El enlace será válido por 1 hora.</p>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.btnSecondary}
                onClick={() => setShowPasswordModal(false)}
              >
                Cancelar
              </button>
              <button 
                className={styles.btnPrimary}
                onClick={handleSolicitarCambioPassword}
              >
                📧 Enviar Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para agregar/editar dirección */}
      {showDireccionModal && (
        <div className={styles.modalOverlay} onClick={cerrarModalDireccion}>
          <div className={`${styles.modalContent} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>📍 {direccionEditando ? 'Editar' : 'Agregar'} Dirección</h3>
              <button className={styles.modalClose} onClick={cerrarModalDireccion}>✕</button>
            </div>
            
            <div className={styles.modalBody}>
              {/* Selector de método */}
              <div className={styles.metodoSelector}>
                <button
                  className={`${styles.metodoBtn} ${metodoIngreso === 'gps' ? styles.metodoBtnActive : ''}`}
                  onClick={() => setMetodoIngreso('gps')}
                >
                  📍 Usar GPS
                </button>
                <button
                  className={`${styles.metodoBtn} ${metodoIngreso === 'manual' ? styles.metodoBtnActive : ''}`}
                  onClick={() => setMetodoIngreso('manual')}
                >
                  ✍️ Llenar Manual
                </button>
              </div>

              {/* Botón GPS */}
              {metodoIngreso === 'gps' && (
                <div className={styles.gpsSection}>
                  <button
                    className={styles.btnGps}
                    onClick={obtenerUbicacionGPS}
                    disabled={obteniendoUbicacion}
                  >
                    {obteniendoUbicacion ? '⏳ Obteniendo ubicación...' : '📍 Obtener mi ubicación actual'}
                  </button>
                  <p className={styles.gpsHint}>
                    Permite el acceso a tu ubicación para autocompletar la dirección
                  </p>
                </div>
              )}

              {/* Formulario */}
              <div className={styles.formDireccion}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Alias *</label>
                    <select
                      value={formDireccion.alias}
                      onChange={(e) => setFormDireccion({...formDireccion, alias: e.target.value})}
                    >
                      <option value="">Selecciona...</option>
                      <option value="Casa">🏠 Casa</option>
                      <option value="Trabajo">💼 Trabajo</option>
                      <option value="Otro">📍 Otro</option>
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Provincia *</label>
                    <select
                      value={formDireccion.provincia}
                      onChange={(e) => setFormDireccion({...formDireccion, provincia: e.target.value})}
                    >
                      <option value="">Selecciona...</option>
                      <option value="Buenos Aires">Buenos Aires</option>
                      <option value="CABA">CABA</option>
                      <option value="Catamarca">Catamarca</option>
                      <option value="Chaco">Chaco</option>
                      <option value="Chubut">Chubut</option>
                      <option value="Córdoba">Córdoba</option>
                      <option value="Corrientes">Corrientes</option>
                      <option value="Entre Ríos">Entre Ríos</option>
                      <option value="Formosa">Formosa</option>
                      <option value="Jujuy">Jujuy</option>
                      <option value="La Pampa">La Pampa</option>
                      <option value="La Rioja">La Rioja</option>
                      <option value="Mendoza">Mendoza</option>
                      <option value="Misiones">Misiones</option>
                      <option value="Neuquén">Neuquén</option>
                      <option value="Río Negro">Río Negro</option>
                      <option value="Salta">Salta</option>
                      <option value="San Juan">San Juan</option>
                      <option value="San Luis">San Luis</option>
                      <option value="Santa Cruz">Santa Cruz</option>
                      <option value="Santa Fe">Santa Fe</option>
                      <option value="Santiago del Estero">Santiago del Estero</option>
                      <option value="Tierra del Fuego">Tierra del Fuego</option>
                      <option value="Tucumán">Tucumán</option>
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Ciudad *</label>
                    <input
                      type="text"
                      value={formDireccion.ciudad}
                      onChange={(e) => setFormDireccion({...formDireccion, ciudad: e.target.value})}
                      placeholder="Ej: Córdoba, Rosario, etc."
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Código Postal</label>
                    <input
                      type="text"
                      value={formDireccion.codigoPostal}
                      onChange={(e) => setFormDireccion({...formDireccion, codigoPostal: e.target.value})}
                      placeholder="Ej: 5000"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup} style={{flex: 2}}>
                    <label>Calle *</label>
                    <input
                      type="text"
                      value={formDireccion.calle}
                      onChange={(e) => setFormDireccion({...formDireccion, calle: e.target.value})}
                      placeholder="Ej: Av. Colón"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Número</label>
                    <input
                      type="text"
                      value={formDireccion.numero}
                      onChange={(e) => setFormDireccion({...formDireccion, numero: e.target.value})}
                      placeholder="1234"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Piso</label>
                    <input
                      type="text"
                      value={formDireccion.piso}
                      onChange={(e) => setFormDireccion({...formDireccion, piso: e.target.value})}
                      placeholder="Ej: 5"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Departamento</label>
                    <input
                      type="text"
                      value={formDireccion.departamento}
                      onChange={(e) => setFormDireccion({...formDireccion, departamento: e.target.value})}
                      placeholder="Ej: B"
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Referencias</label>
                  <textarea
                    value={formDireccion.referencias}
                    onChange={(e) => setFormDireccion({...formDireccion, referencias: e.target.value})}
                    placeholder="Ej: Portón negro, timbre 3, entre calle X y calle Y"
                    rows={3}
                  />
                </div>

                <div className={styles.formCheckbox}>
                  <input
                    type="checkbox"
                    id="esPrincipal"
                    checked={formDireccion.esPrincipal}
                    onChange={(e) => setFormDireccion({...formDireccion, esPrincipal: e.target.checked})}
                  />
                  <label htmlFor="esPrincipal">⭐ Marcar como dirección principal</label>
                </div>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={cerrarModalDireccion}>
                Cancelar
              </button>
              <button className={styles.btnPrimary} onClick={guardarDireccion}>
                💾 Guardar Dirección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
