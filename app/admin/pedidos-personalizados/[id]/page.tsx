'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './pedido-detalle.module.css';

type Pedido = {
  id: string;
  userEmail: string;
  userName: string;
  disenoBase: string | null;
  disenoPropio: string | null;
  telasSeleccionadas: string[];
  comentarios: string;
  estado: 'PENDIENTE' | 'EN_MODIFICACION' | 'APROBADO' | 'ESPERANDO_STOCK' | 'EN_PRODUCCION' | 'TERMINADO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
  fechaCreacion: string;
  fechaActualizacion: string;
  usuario?: {
    nombre: string;
    email: string;
    direccionPrincipal?: {
      alias: string;
      provincia: string;
      ciudad: string;
      calle: string;
      numero: string;
      piso?: string;
      departamento?: string;
      codigoPostal?: string;
      referencias?: string;
      latitud?: number;
      longitud?: number;
    }
  }
};

const ESTADOS = {
  PENDIENTE: { label: '⏳ Pendiente', color: '#ff9800' },
  EN_MODIFICACION: { label: '✏️ En Modificación', color: '#FFC107' },
  APROBADO: { label: '✅ Aprobado', color: '#547552' },
  ESPERANDO_STOCK: { label: '📦 Esperando Stock', color: '#9CC3A6' },
  EN_PRODUCCION: { label: '🏭 En Producción', color: '#2196F3' },
  TERMINADO: { label: '✔️ Terminado', color: '#00BCD4' },
  ENVIADO: { label: '🚚 Enviado', color: '#8BC34A' },
  ENTREGADO: { label: '🏠 Entregado', color: '#4CAF50' },
  CANCELADO: { label: '❌ Cancelado', color: '#D78492' }
};

// Normalizar estado del backend a formato esperado
const normalizarEstado = (estado: string): Pedido['estado'] => {
  const estadoUpper = estado.toUpperCase();
  const mapeo: Record<string, Pedido['estado']> = {
    'PENDIENTE': 'PENDIENTE',
    'EN_MODIFICACION': 'EN_MODIFICACION',
    'EN_MODIFICACIÓN': 'EN_MODIFICACION',
    'APROBADO': 'APROBADO',
    'ESPERANDO_STOCK': 'ESPERANDO_STOCK',
    'EN_PRODUCCION': 'EN_PRODUCCION',
    'EN_PRODUCCIÓN': 'EN_PRODUCCION',
    'EN_PROCESO': 'EN_PRODUCCION',
    'TERMINADO': 'TERMINADO',
    'ENVIADO': 'ENVIADO',
    'ENTREGADO': 'ENTREGADO',
    'COMPLETADO': 'ENTREGADO',
    'CANCELADO': 'CANCELADO'
  };
  return mapeo[estadoUpper] || 'PENDIENTE';
};

// Convertir estado del frontend al formato del backend (snake_case y minúsculas)
const estadoParaBackend = (estado: Pedido['estado']): string => {
  const mapeo: Record<Pedido['estado'], string> = {
    'PENDIENTE': 'pendiente',
    'EN_MODIFICACION': 'en_modificacion',
    'APROBADO': 'aprobado',
    'ESPERANDO_STOCK': 'esperando_stock',
    'EN_PRODUCCION': 'en_produccion',
    'TERMINADO': 'terminado',
    'ENVIADO': 'enviado',
    'ENTREGADO': 'entregado',
    'CANCELADO': 'cancelado'
  };
  return mapeo[estado] || 'pendiente';
};

export default function PedidoDetallePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const pedidoId = params.id as string;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotificacion, setShowNotificacion] = useState(false);
  const [estadoNuevo, setEstadoNuevo] = useState<string>('');
  const [comentarioAdmin, setComentarioAdmin] = useState<string>('');
  const [imagenExpandida, setImagenExpandida] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }
    cargarPedido();
  }, [session, router, pedidoId]);

  const cargarPedido = async () => {
    try {
      setLoading(true);
      console.log('📥 Cargando pedido con ID desde params:', pedidoId);
      console.log('📍 URL completa:', `/api/personalizacion/pedidos/${pedidoId}`);
      
      const response = await fetch(`/api/personalizacion/pedidos/${pedidoId}`);
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del backend:', errorData);
        throw new Error(errorData.error || 'Pedido no encontrado');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('El endpoint no devuelve JSON');
      }

      const data = await response.json();
      console.log('📦 Pedido recibido del backend:', data);
      console.log('🆔 pedido.id del backend:', data.id);
      console.log('🆔 pedidoId de params:', pedidoId);
      console.log('⚠️ ¿Son iguales?:', data.id === pedidoId);
      console.log('🎨 disenoBase del backend:', data.disenoBase);
      console.log('🎨 disenoPropio del backend:', data.disenoPropio);
      console.log('🧵 telas del backend:', data.telas);
      
      // Helper para normalizar URLs: siempre devolver URLs completas del backend
      const normalizeUrl = (url: string | undefined | null): string | null => {
        if (!url) return null;
        
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        
        // Decodificar URL por si tiene caracteres especiales codificados
        try {
          url = decodeURIComponent(url);
        } catch (e) {
          // Si falla la decodificación, usar la URL original
        }
        
        console.log('🔍 Normalizando URL:', url);
        
        // Si ya es una URL completa del backend, devolverla limpiando dobles /uploads/
        if (url.startsWith('http://') || url.startsWith('https://')) {
          const cleaned = url.replace(/\/uploads\/images\/\/uploads\//g, '/uploads/');
          console.log('✅ URL completa limpiada:', cleaned);
          return cleaned;
        }
        
        // Si es una URL relativa, construir URL completa del backend
        let cleaned = url.replace(/^\/+/, '').replace(/\/\/+/g, '/');
        
        // Si no empieza con uploads/, agregarlo
        if (!cleaned.startsWith('uploads/')) {
          if (cleaned.startsWith('telas/') || cleaned.startsWith('disenos-base/') || cleaned.startsWith('disenos/')) {
            cleaned = `uploads/${cleaned}`;
          }
        }
        
        const fullUrl = `${BACKEND_URL}/${cleaned}`;
        console.log('✅ URL completa construida:', fullUrl);
        return fullUrl;
      };
      
      // Normalizar datos del backend al formato del frontend
      const userName = data.usuario?.nombre || data.usuarioNombre || data.userName || 'Sin nombre';
      const userEmail = data.usuario?.email || data.usuarioEmail || data.userEmail || 'Sin email';
      
      console.log('👤 Usuario detectado:', { userName, userEmail });
      
      const pedidoNormalizado: Pedido = {
        id: data.id,
        userEmail: userEmail,
        userName: userName,
        disenoBase: typeof data.disenoBase === 'object' && data.disenoBase 
          ? normalizeUrl(data.disenoBase.imagenPrincipal || data.disenoBase.imagenes?.[0] || data.disenoBase.id)
          : normalizeUrl(data.disenoBase),
        disenoPropio: normalizeUrl(data.disenoPropio),
        telasSeleccionadas: Array.isArray(data.telas) 
          ? data.telas.map((t: any) => {
              const imagen = typeof t === 'object' ? (t.imagenPrincipal || t.imagenes?.[0] || t.nombre || t.id) : t;
              return normalizeUrl(imagen) || '';
            }).filter((url: string) => url !== '')
          : Array.isArray(data.telasSeleccionadas) 
          ? data.telasSeleccionadas.map((t: string) => normalizeUrl(t) || '').filter((url: string) => url !== '')
          : [],
        comentarios: data.comentarios || '',
        estado: normalizarEstado(data.estado),
        fechaCreacion: data.fechaCreacion,
        fechaActualizacion: data.fechaActualizacion,
        usuario: data.usuario ? {
          nombre: userName,
          email: userEmail,
          direccionPrincipal: data.usuario.direccionPrincipal || null
        } : undefined
      };
      
      console.log('🧵 Telas mapeadas:', pedidoNormalizado.telasSeleccionadas);
      
      console.log('✅ Pedido normalizado:', pedidoNormalizado);
      setPedido(pedidoNormalizado);
    } catch (error) {
      console.error('💥 Error completo:', error);
      showToast('Error al cargar pedido. Verifica que el pedido exista en el backend.', 'error');
      router.push('/admin/pedidos-personalizados');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const cambiarEstado = (nuevoEstado: Pedido['estado']) => {
    setEstadoNuevo(nuevoEstado);
    setShowNotificacion(true);
  };

  const confirmarCambioEstado = async () => {
    if (!pedido) return;

    console.log('=== INICIO CAMBIO DE ESTADO ===');
    console.log('Pedido ID desde params:', pedidoId);
    console.log('Pedido ID desde pedido.id:', pedido.id);
    console.log('Estado actual:', pedido.estado);
    console.log('Estado nuevo:', estadoNuevo);
    console.log('Comentario admin:', comentarioAdmin || '(vacío - se usará mensaje automático)');

    try {
      // 1. Actualizar estado del pedido
      console.log('1. Actualizando estado del pedido...');
      console.log('📤 URL:', `/api/personalizacion/pedidos/${pedidoId}`);
      console.log('📤 Method: PATCH');
      console.log('📤 Estado frontend:', estadoNuevo);
      
      const estadoBackend = estadoParaBackend(estadoNuevo as Pedido['estado']);
      console.log('📤 Estado convertido para backend:', estadoBackend);
      console.log('📤 Body:', JSON.stringify({ estado: estadoBackend }));
      
      const response = await fetch(`/api/personalizacion/pedidos/${pedidoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: estadoBackend })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        let errorData;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          errorData = { error: text || `Error ${response.status}` };
        }
        
        console.error('❌ Error al actualizar estado:', errorData);
        console.error('📋 Status completo:', response.status, response.statusText);
        
        const errorMsg = errorData.error || errorData.message || JSON.stringify(errorData) || `Error ${response.status}`;
        showToast(`Error al actualizar estado: ${errorMsg}`, 'error');
        setShowNotificacion(false);
        return;
      }

      console.log('✅ Estado actualizado exitosamente');

      // 2. Enviar mensaje a la conversación del pedido
      const mensaje = comentarioAdmin || `Estado del pedido cambiado de ${ESTADOS[pedido.estado].label} a ${ESTADOS[estadoNuevo as Pedido['estado']].label}`;
      
      const mensajeBody = {
        pedidoId: pedidoId, // Usar pedidoId de params, no pedido.id
        mensaje: mensaje,
        esAdmin: true,
        cambioEstado: {
          estadoAnterior: ESTADOS[pedido.estado].label,
          estadoNuevo: ESTADOS[estadoNuevo as Pedido['estado']].label
        }
      };

      console.log('2. Enviando mensaje a la conversación...');
      console.log('URL:', `/api/personalizacion/pedidos/${pedidoId}/mensajes`);
      console.log('Body:', JSON.stringify(mensajeBody, null, 2));

      const mensajeResponse = await fetch(`/api/personalizacion/pedidos/${pedidoId}/mensajes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mensajeBody)
      });

      console.log('Mensaje Response status:', mensajeResponse.status);
      console.log('Mensaje Response ok:', mensajeResponse.ok);

      if (!mensajeResponse.ok) {
        const errorData = await mensajeResponse.json().catch(() => ({ error: 'Error desconocido' }));
        console.error('❌ Error al enviar mensaje:', errorData);
        showToast('Estado actualizado pero error al enviar el mensaje. Verifica la consola.', 'error');
        // Recargar pedido para mostrar nuevo estado
        await cargarPedido();
        setShowNotificacion(false);
        return;
      }

      const mensajeData = await mensajeResponse.json();
      console.log('✅ Mensaje creado exitosamente:', mensajeData);
      console.log('=== FIN CAMBIO DE ESTADO ===');

      showToast('✅ Estado actualizado y notificación enviada', 'success');
      setShowNotificacion(false);
      setComentarioAdmin('');
      
      // Disparar evento para actualizar notificaciones en navbar
      window.dispatchEvent(new Event('pedidoActualizado'));
      
      // Redirigir a la conversación para que el admin vea el mensaje enviado
      setTimeout(() => {
        console.log('Redirigiendo a:', `/admin/mensajeria/${pedidoId}`);
        router.push(`/admin/mensajeria/${pedidoId}`);
      }, 1000);
    } catch (error: any) {
      console.error('💥 Error completo en cambio de estado:', error);
      showToast(`Error: ${error.message || 'Error al actualizar estado'}`, 'error');
      setShowNotificacion(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando pedido...</div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Pedido no encontrado</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/admin/pedidos-personalizados" className={styles.backBtn}>
          ← Volver a Pedidos
        </Link>
        <h1 className={styles.title}>Pedido #{pedido.id.slice(-6)}</h1>
        <span
          className={styles.estadoBadge}
          style={{ backgroundColor: ESTADOS[pedido.estado].color }}
        >
          {ESTADOS[pedido.estado].label}
        </span>
      </header>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>👤 Información del Cliente</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <strong>Nombre:</strong>
              <span>{pedido.userName}</span>
            </div>
            <div className={styles.infoItem}>
              <strong>Email:</strong>
              <span>{pedido.userEmail}</span>
            </div>
          </div>
        </section>

        {/* Dirección de Envío */}
        {pedido.usuario?.direccionPrincipal && (
          <section className={styles.section}>
            <h2>📍 Dirección de Envío</h2>
            <div className={styles.direccionCard}>
              <div className={styles.direccionHeader}>
                <span className={styles.aliasTag}>{pedido.usuario.direccionPrincipal.alias}</span>
              </div>
              <div className={styles.direccionInfo}>
                <p className={styles.direccionCalle}>
                  {pedido.usuario.direccionPrincipal.calle} {pedido.usuario.direccionPrincipal.numero}
                  {pedido.usuario.direccionPrincipal.piso && `, Piso ${pedido.usuario.direccionPrincipal.piso}`}
                  {pedido.usuario.direccionPrincipal.departamento && ` Depto. ${pedido.usuario.direccionPrincipal.departamento}`}
                </p>
                <p className={styles.direccionLocalidad}>
                  {pedido.usuario.direccionPrincipal.ciudad}, {pedido.usuario.direccionPrincipal.provincia}
                  {pedido.usuario.direccionPrincipal.codigoPostal && ` - CP ${pedido.usuario.direccionPrincipal.codigoPostal}`}
                </p>
                {pedido.usuario.direccionPrincipal.referencias && (
                  <p className={styles.direccionReferencias}>
                    <strong>📝 Referencias:</strong> {pedido.usuario.direccionPrincipal.referencias}
                  </p>
                )}
                {pedido.usuario.direccionPrincipal.latitud && pedido.usuario.direccionPrincipal.longitud && (
                  <p className={styles.direccionGps}>
                    <strong>📍 GPS:</strong> {Number(pedido.usuario.direccionPrincipal.latitud).toFixed(6)}, {Number(pedido.usuario.direccionPrincipal.longitud).toFixed(6)}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h2>🎨 Diseño</h2>
          {pedido.disenoPropio ? (
            <div className={styles.disenoContainer}>
              <p><strong>Tipo:</strong> Diseño propio subido por el cliente</p>
              <div 
                className={`${styles.miniaturaWrapper} ${imagenExpandida === pedido.disenoPropio ? styles.expandida : ''}`}
                onClick={() => setImagenExpandida(imagenExpandida === pedido.disenoPropio ? null : pedido.disenoPropio)}
              >
                <img 
                  src={pedido.disenoPropio} 
                  alt="Diseño del cliente" 
                  className={styles.miniatura}
                  onError={(e) => {
                    console.error('❌ Error cargando imagen diseño propio:', e.currentTarget.src);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          ) : pedido.disenoBase ? (
            <div className={styles.disenoContainer}>
              <p><strong>Tipo:</strong> Modelo del catálogo</p>
              <div 
                className={`${styles.miniaturaWrapper} ${imagenExpandida === pedido.disenoBase ? styles.expandida : ''}`}
                onClick={() => setImagenExpandida(imagenExpandida === pedido.disenoBase ? null : pedido.disenoBase)}
              >
                <img 
                  src={pedido.disenoBase}
                  alt="Modelo del catálogo" 
                  className={styles.miniatura}
                  onError={(e) => {
                    console.error('❌ Error cargando imagen diseño base:', e.currentTarget.src);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            </div>
          ) : (
            <p>Sin diseño seleccionado</p>
          )}
        </section>

        <section className={styles.section}>
          <h2>🧵 Telas Seleccionadas</h2>
          <div className={styles.telasGrid}>
            {pedido.telasSeleccionadas && pedido.telasSeleccionadas.length > 0 ? (
              pedido.telasSeleccionadas.map((tela, idx) => (
                <div 
                  key={idx}
                  className={`${styles.miniaturaWrapper} ${imagenExpandida === tela ? styles.expandida : ''}`}
                  onClick={() => setImagenExpandida(imagenExpandida === tela ? null : tela)}
                >
                  <img 
                    src={tela}
                    alt={`Tela ${idx + 1}`}
                    className={styles.miniatura}
                    onError={(e) => {
                      console.error('❌ Error cargando imagen tela:', e.currentTarget.src);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <p className={styles.telaLabel}>Tela {idx + 1}</p>
                </div>
              ))
            ) : (
              <p>No hay telas seleccionadas</p>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2>📝 Especificaciones del Cliente</h2>
          <div className={styles.comentariosBox}>
            {pedido.comentarios || 'Sin comentarios adicionales'}
          </div>
        </section>

        <section className={styles.section}>
          <h2>🔄 Cambiar Estado del Pedido</h2>
          <div className={styles.estadoBtns}>
            {Object.entries(ESTADOS).map(([key, value]) => (
              <button
                key={key}
                className={`${styles.estadoBtn} ${pedido.estado === key ? styles.estadoBtnActive : ''}`}
                style={{ 
                  backgroundColor: pedido.estado === key ? value.color : 'white',
                  color: pedido.estado === key ? 'white' : value.color,
                  borderColor: value.color
                }}
                onClick={() => cambiarEstado(key as Pedido['estado'])}
                disabled={pedido.estado === key}
              >
                {value.label}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>📅 Fechas</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <strong>Creado:</strong>
              <span>{new Date(pedido.fechaCreacion).toLocaleString()}</span>
            </div>
            <div className={styles.infoItem}>
              <strong>Última actualización:</strong>
              <span>{new Date(pedido.fechaActualizacion).toLocaleString()}</span>
            </div>
          </div>
        </section>
      </div>

      {/* Modal de Notificación de Cambio de Estado */}
      {showNotificacion && (
        <div className={styles.modalOverlay} onClick={() => setShowNotificacion(false)}>
          <div className={styles.notificacionModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowNotificacion(false)}>×</button>
            
            <h2 className={styles.modalTitle}>🔔 Cambio de Estado</h2>

            <div className={styles.cambioEstadoInfo}>
              <div className={styles.estadoCambio}>
                <span 
                  className={styles.estadoBadgeModal}
                  style={{ backgroundColor: ESTADOS[pedido.estado]?.color }}
                >
                  {ESTADOS[pedido.estado]?.label}
                </span>
                <span className={styles.arrow}>→</span>
                <span 
                  className={styles.estadoBadgeModal}
                  style={{ backgroundColor: ESTADOS[estadoNuevo as Pedido['estado']]?.color }}
                >
                  {ESTADOS[estadoNuevo as Pedido['estado']]?.label}
                </span>
              </div>
            </div>

            <div className={styles.comentarioSection}>
              <label htmlFor="comentarioAdmin">
                <strong>Mensaje para el cliente:</strong>
                <span className={styles.opcional}>(opcional)</span>
              </label>
              <textarea
                id="comentarioAdmin"
                className={styles.comentarioTextarea}
                placeholder="Escribe un mensaje que se enviará al cliente junto con la notificación de cambio de estado..."
                value={comentarioAdmin}
                onChange={(e) => setComentarioAdmin(e.target.value)}
                rows={4}
              />
              <p className={styles.hint}>
                Si no escribes un mensaje, se enviará una notificación automática del cambio de estado.
              </p>
            </div>

            <div className={styles.modalActions}>
              <button 
                className={styles.cancelBtn}
                onClick={() => {
                  setShowNotificacion(false);
                  setComentarioAdmin('');
                }}
              >
                Cancelar
              </button>
              <button 
                className={styles.confirmBtn}
                onClick={confirmarCambioEstado}
              >
                ✔️ Confirmar y Notificar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
