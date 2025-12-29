// Importamos useState para manejar el estado del menú (abierto/cerrado)
// Link es el componente de Next.js para navegación entre páginas
'use client'
import { useState, useEffect } from 'react' 
import { useSession, signOut } from 'next-auth/react'
import { useCart } from '@/contexts/CartContext'
import Link from 'next/link'
import styles from './navbar.module.css'

const Navbar = () => {
  // Obtener la sesión del usuario (si está logueado)
  const { data: session } = useSession()
  // Obtener el total de items del carrito
  const { getTotalItems } = useCart()
  
  // Estado para controlar si el menú móvil está abierto o cerrado
  const [isOpen, setIsOpen] = useState(false)
  // Estado para controlar si el menú de usuario está abierto
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  // Estado para controlar si el menú de categorías está abierto
  const [isCategoriasOpen, setIsCategoriasOpen] = useState(false)
  
  // Estados para notificaciones admin
  const [pendingCount, setPendingCount] = useState(0)
  const [solicitudesCount, setSolicitudesCount] = useState(0)
  const [mensajesCount, setMensajesCount] = useState(0)
  
  // Estado para mensajes no leídos del cliente
  const [clienteMensajesCount, setClienteMensajesCount] = useState(0)

  // Función para alternar el menú (abrir/cerrar)
  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  // Función para alternar el menú de usuario
  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
  }

  // Función para cerrar sesión
  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  // Cargar contadores de notificaciones para admin
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      cargarNotificaciones()
      
      // Actualizar cada 30 segundos
      const interval = setInterval(cargarNotificaciones, 30000)
      
      // Escuchar evento de mensajes leídos para actualizar inmediatamente
      const handleMensajesLeidos = () => {
        cargarNotificaciones()
      }
      window.addEventListener('mensajesLeidos', handleMensajesLeidos)
      
      // Escuchar evento de pedido actualizado para actualizar contadores
      const handlePedidoActualizado = () => {
        cargarNotificaciones()
      }
      window.addEventListener('pedidoActualizado', handlePedidoActualizado)
      
      // Escuchar evento de solicitud actualizada para actualizar contadores
      const handleSolicitudActualizada = () => {
        cargarNotificaciones()
      }
      window.addEventListener('solicitudActualizada', handleSolicitudActualizada)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('mensajesLeidos', handleMensajesLeidos)
        window.removeEventListener('pedidoActualizado', handlePedidoActualizado)
        window.removeEventListener('solicitudActualizada', handleSolicitudActualizada)
      }
    } else if (session?.user) {
      // Cargar mensajes para cliente
      cargarMensajesCliente()
      
      // Actualizar cada 30 segundos
      const interval = setInterval(cargarMensajesCliente, 30000)
      
      // Escuchar evento de mensajes leídos para actualizar inmediatamente
      const handleMensajesLeidos = () => {
        cargarMensajesCliente()
      }
      window.addEventListener('mensajesLeidos', handleMensajesLeidos)
      
      return () => {
        clearInterval(interval)
        window.removeEventListener('mensajesLeidos', handleMensajesLeidos)
      }
    }
  }, [session])

  const cargarNotificaciones = async () => {
    try {
      // Pedidos pendientes/en modificación
      const pedidosRes = await fetch('/api/personalizacion/pedidos')
      if (pedidosRes.ok) {
        const pedidos = await pedidosRes.json()
        const pending = pedidos.filter((p: any) => 
          p.estado === 'pendiente' || p.estado === 'PENDIENTE' || p.estado === 'EN_MODIFICACION'
        ).length
        setPendingCount(pending)
      }

      // Solicitudes de modificación pendientes
      const solicitudesRes = await fetch('/api/admin/solicitudes-modificacion')
      if (solicitudesRes.ok) {
        const solicitudes = await solicitudesRes.json()
        const pendientes = solicitudes.filter((s: any) => s.estado === 'pendiente').length
        setSolicitudesCount(pendientes)
      }

      // Mensajes no leídos
      const mensajesRes = await fetch('/api/admin/mensajeria/pedidos')
      if (mensajesRes.ok) {
        const pedidos = await mensajesRes.json()
        console.log('📊 Pedidos recibidos para mensajería:', pedidos);
        const pedidosConMensajes = pedidos.filter((p: any) => p.mensajesNoLeidos > 0);
        console.log('📊 Pedidos con mensajes no leídos:', pedidosConMensajes.map((p: any) => ({
          id: p.id,
          mensajesNoLeidos: p.mensajesNoLeidos,
          ultimoMensaje: p.ultimoMensaje
        })));
        const mensajesNoLeidos = pedidosConMensajes.length;
        console.log('📊 Total de conversaciones con mensajes no leídos:', mensajesNoLeidos);
        setMensajesCount(mensajesNoLeidos)
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error)
    }
  }
  
  const cargarMensajesCliente = async () => {
    try {
      const res = await fetch('/api/personalizacion/pedidos')
      if (res.ok) {
        const pedidos = await res.json()
        
        let totalMensajesNoLeidos = 0
        
        for (const pedido of pedidos) {
          const mensajesRes = await fetch(`/api/personalizacion/pedidos/${pedido.id}/mensajes`)
          if (mensajesRes.ok) {
            const mensajes = await mensajesRes.json()
            const noLeidos = mensajes.filter((m: any) => m.esAdmin && !m.leido).length
            totalMensajesNoLeidos += noLeidos
          }
        }
        
        setClienteMensajesCount(totalMensajesNoLeidos)
      }
    } catch (error) {
      console.error('Error cargando mensajes del cliente:', error)
    }
  }

  return (
    // Contenedor principal de la barra de navegación
    <nav className={styles.navbar}>
      {/* Contenedor interno para limitar el ancho y centrar */}
      <div className={styles.container}>
        
        {/* Menú de navegación a la izquierda */}
        <div className={`${styles.menu} ${isOpen ? styles.menuOpen : ''}`}>
          
          {session?.user?.role === 'admin' ? (
            /* Menú para Administrador */
            <>
              <div className={styles.adminMenuContainer}>
                <div className={styles.adminMenuRow}>
                  <Link href="/admin" onClick={() => setIsOpen(false)} className={styles.adminLink}>
                    🔒 Panel Admin
                  </Link>
                  <Link href="/admin/productos" onClick={() => setIsOpen(false)}>
                    📦 Productos
                  </Link>
                  <Link href="/admin/productos/nuevo" onClick={() => setIsOpen(false)}>
                    ➕ Nuevo Producto
                  </Link>
                  <Link href="/admin/disenos-telas" onClick={() => setIsOpen(false)}>
                    🎨 Diseños y Telas
                  </Link>
                </div>
                <div className={styles.adminMenuRow}>
                  <Link href="/admin/pedidos-personalizados" onClick={() => setIsOpen(false)} className={styles.notificationLink}>
                    📋 Pedidos
                    {pendingCount > 0 && <span className={styles.badge}>{pendingCount}</span>}
                  </Link>
                  <Link href="/admin/solicitudes-modificacion" onClick={() => setIsOpen(false)} className={styles.notificationLink}>
                    ✏️ Solicitudes
                    {solicitudesCount > 0 && <span className={styles.badge}>{solicitudesCount}</span>}
                  </Link>
                  <Link href="/admin/carrusel" onClick={() => setIsOpen(false)}>
                    🖼️ Carrusel
                  </Link>
                  <Link href="/admin/mensajeria" onClick={() => setIsOpen(false)} className={styles.notificationLink}>
                    💬 Mensajería
                    {mensajesCount > 0 && <span className={styles.badge}>{mensajesCount}</span>}
                  </Link>
                  <Link href="/admin/ventas" onClick={() => setIsOpen(false)}>
                    💰 Ventas
                  </Link>
                </div>
              </div>
            </>
          ) : (
            /* Menú para Usuario Común */
            <>
              {/* Enlace a la página principal */}
              <Link href="/" onClick={() => setIsOpen(false)}>
                Inicio
              </Link>

              {/* Enlace a mis pedidos */}
              <Link href="/mis-pedidos" onClick={() => setIsOpen(false)} className={clienteMensajesCount > 0 ? styles.notificationLink : ''}>
                📋 Mis Pedidos
                {clienteMensajesCount > 0 && <span className={styles.badge}>{clienteMensajesCount}</span>}
              </Link>
              
              {/* Enlace a mis compras */}
              <Link href="/mis-compras" onClick={() => setIsOpen(false)}>
                🛍️ Mis Compras
              </Link>
              
              <Link href="/productos/nuevos" onClick={() => setIsOpen(false)}>
                ✨ Productos Nuevos
              </Link>

              <div 
                className={styles.categoriasDropdown}
                onMouseEnter={() => setIsCategoriasOpen(true)}
                onMouseLeave={() => setIsCategoriasOpen(false)}
              >
                <button className={styles.categoriasButton}>
                  Categorías ▾
                </button>
                
                <div className={`${styles.categoriasSubmenu} ${isCategoriasOpen ? styles.categoriasSubmenuOpen : ''}`}>
                  <Link href="/productos?categoria=carteras" className={styles.categoriaItem}>
                    Carteras
                  </Link>
                  <Link href="/productos?categoria=rinoneras" className={styles.categoriaItem}>
                    Riñoneras
                  </Link>
                  <Link href="/productos?categoria=materas" className={styles.categoriaItem}>
                    Materas
                  </Link>
                  <Link href="/productos?categoria=combos" className={styles.categoriaItem}>
                    Combos
                  </Link>
                  <Link href="/productos?categoria=mochilas" className={styles.categoriaItem}>
                    Mochilas
                  </Link>
                  <Link href="/productos?categoria=neceser_pileta" className={styles.categoriaItem}>
                    Neceser Pileta
                  </Link>
                  <Link href="/productos?categoria=neceser_higiene" className={styles.categoriaItem}>
                    Neceser Higiene
                  </Link>
                  <Link href="/productos?categoria=mantel_camping" className={styles.categoriaItem}>
                    Mantel Camping
                  </Link>
                  <Link href="/productos?categoria=bolso_camping" className={styles.categoriaItem}>
                    Bolso Camping
                  </Link>
                  <Link href="/productos?categoria=lonchera_termica" className={styles.categoriaItem}>
                    Lonchera Térmica
                  </Link>
                  <Link href="/productos?categoria=mochilas_pequenas" className={styles.categoriaItem}>
                    Mochilas Pequeñas
                  </Link>
                  <Link href="/productos?categoria=kit_dormir" className={styles.categoriaItem}>
                    Kit Dormir
                  </Link>
                  <Link href="/productos?categoria=otros" className={styles.categoriaItem}>
                    Otros
                  </Link>
                  <div className={styles.submenuDivider}></div>
                  <Link href="/productos" className={styles.categoriaItem}>
                    Todos nuestros productos
                  </Link>
                </div>
              </div>

              <div className={styles.categoriasMobile}>
                <Link href="/productos?categoria=carteras" onClick={() => setIsOpen(false)}>
                  Carteras
                </Link>
                
                <Link href="/productos?categoria=rinoneras" onClick={() => setIsOpen(false)}>
                  Riñoneras
                </Link>
                
                <Link href="/productos?categoria=materas" onClick={() => setIsOpen(false)}>
                  Materas
                </Link>
                
                <Link href="/productos?categoria=combos" onClick={() => setIsOpen(false)}>
                  Combos
                </Link>

                <Link href="/productos?categoria=mochilas" onClick={() => setIsOpen(false)}>
                  Mochilas
                </Link>

                <Link href="/productos?categoria=neceser_pileta" onClick={() => setIsOpen(false)}>
                  Neceser Pileta
                </Link>

                <Link href="/productos?categoria=neceser_higiene" onClick={() => setIsOpen(false)}>
                  Neceser Higiene
                </Link>

                <Link href="/productos?categoria=mantel_camping" onClick={() => setIsOpen(false)}>
                  Mantel Camping
                </Link>

                <Link href="/productos?categoria=bolso_camping" onClick={() => setIsOpen(false)}>
                  Bolso Camping
                </Link>

                <Link href="/productos?categoria=lonchera_termica" onClick={() => setIsOpen(false)}>
                  Lonchera Térmica
                </Link>

                <Link href="/productos?categoria=mochilas_pequenas" onClick={() => setIsOpen(false)}>
                  Mochilas Pequeñas
                </Link>

                <Link href="/productos?categoria=kit_dormir" onClick={() => setIsOpen(false)}>
                  Kit Dormir
                </Link>

                <Link href="/productos?categoria=otros" onClick={() => setIsOpen(false)}>
                  Otros
                </Link>

                <Link href="/productos" onClick={() => setIsOpen(false)}>
                  Todos nuestros productos
                </Link>
              </div>

              <Link href="/contacto" onClick={() => setIsOpen(false)}>
                Contacto
              </Link>
            </>
          )}
        </div>

        {/* Ícono de usuario y carrito a la derecha */}
        <div className={styles.userIconWrapper}>
            {/* Ícono del carrito - solo para usuarios comunes, NO para admin */}
            {session?.user?.role !== 'admin' && (
              <Link href="/carrito" className={styles.cartIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                {getTotalItems() > 0 && (
                  <span className={styles.cartBadge}>{getTotalItems()}</span>
                )}
              </Link>
            )}

            <div 
              className={styles.userDropdown}
              onMouseEnter={() => setIsUserMenuOpen(true)}
              onMouseLeave={() => setIsUserMenuOpen(false)}
            >
              <div className={styles.userInfo}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                {session && <span className={styles.userNameSmall}>{session.user.name}</span>}
              </div>

              {/* Menú desplegable */}
              <div className={`${styles.userSubmenu} ${isUserMenuOpen ? styles.userSubmenuOpen : ''}`}>
                {session ? (
                  // Usuario logueado
                  <>
                    <div className={styles.submenuHeader}>
                      <strong>{session.user.name}</strong>
                      <span className={styles.userEmail}>{session.user.email}</span>
                      {session.user.role === 'admin' && (
                        <span className={styles.adminBadge}>👑 Admin</span>
                      )}
                    </div>
                    <div className={styles.submenuDivider}></div>
                    
                    {/* Menú específico para Admin */}
                    {session.user.role === 'admin' ? (
                      <>
                        <Link href="/admin" className={styles.submenuItem}>
                          🔒 Panel de Administración
                        </Link>
                        <Link href="/admin/productos/nuevo" className={styles.submenuItem}>
                          ➕ Agregar Producto
                        </Link>
                        <Link href="/admin/carrusel" className={styles.submenuItem}>
                          🖼️ Gestionar Carrusel
                        </Link>
                        <Link href="/admin/ventas" className={styles.submenuItem}>
                          📊 Ver Ventas
                        </Link>
                      </>
                    ) : (
                      /* Menú específico para Usuario */
                      <>
                        <Link href="/mi-cuenta" className={styles.submenuItem}>
                          🧵 Mi Cuenta
                        </Link>
                      </>
                    )}
                    
                    <div className={styles.submenuDivider}></div>
                    <button onClick={handleLogout} className={styles.submenuItem}>
                      🚪 Cerrar Sesión
                    </button>
                  </>
                ) : (
                  // Usuario no logueado
                  <>
                    <Link href="/login" className={styles.submenuItem}>
                      Iniciar Sesión
                    </Link>
                    <Link href="/registro" className={styles.submenuItem}>
                      Registrarse
                    </Link>
                  </>
                )}
              </div>
            </div>
        </div>

        {/* Sección de usuario a la derecha - oculta ahora */}
        <div className={styles.userMenuHidden}>
        </div>

        {/* Botón hamburguesa para menú móvil */}
        <button 
          className={styles.hamburger} 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {/* Ícono de hamburguesa con tres líneas */}
          <span className={isOpen ? styles.active : ''}></span>
          <span className={isOpen ? styles.active : ''}></span>
          <span className={isOpen ? styles.active : ''}></span>
        </button>

      </div>
    </nav>
  )
}

export default Navbar
