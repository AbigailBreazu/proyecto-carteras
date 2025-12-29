'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './solicitudes.module.css';

type SolicitudModificacion = {
  id: string;
  pedidoId: string;
  usuarioId: string;
  usuarioNombre: string;
  motivo: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fechaSolicitud: string;
  fechaRespuesta?: string;
  mensajeAdmin?: string;
};

export default function SolicitudesModificacionPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [solicitudes, setSolicitudes] = useState<SolicitudModificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'pendiente' | 'aprobada' | 'rechazada'>('pendiente');
  const [solicitudActual, setSolicitudActual] = useState<SolicitudModificacion | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [mensajeAdmin, setMensajeAdmin] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success'|'error'} | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'admin') {
      router.push('/');
      return;
    }
    
    cargarSolicitudes();
  }, [session, router]);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/solicitudes-modificacion');
      
      if (response.ok) {
        const data = await response.json();
        setSolicitudes(data);
      } else {
        console.error('Error al cargar solicitudes');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const responderSolicitud = async (accion: 'aprobar' | 'rechazar') => {
    if (!solicitudActual) return;
    
    setProcesando(true);
    
    try {
      const response = await fetch(
        `/api/admin/pedidos/${solicitudActual.pedidoId}/modificacion/${solicitudActual.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accion,
            mensaje: mensajeAdmin || undefined
          })
        }
      );
      
      if (response.ok) {
        setToast({
          message: accion === 'aprobar' ? '✅ Solicitud aprobada' : '❌ Solicitud rechazada',
          type: 'success'
        });
        setTimeout(() => setToast(null), 4000);
        setShowModal(false);
        setSolicitudActual(null);
        setMensajeAdmin('');
        
        // Disparar evento para actualizar notificaciones en navbar
        window.dispatchEvent(new Event('solicitudActualizada'));
        
        cargarSolicitudes();
      } else {
        const error = await response.json();
        setToast({ message: 'Error: ' + error.error, type: 'error' });
        setTimeout(() => setToast(null), 4000);
      }
    } catch (error) {
      console.error('Error:', error);
      setToast({ message: 'Error de conexión', type: 'error' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setProcesando(false);
    }
  };

  const abrirModal = (solicitud: SolicitudModificacion) => {
    setSolicitudActual(solicitud);
    setShowModal(true);
  };

  const solicitudesFiltradas = solicitudes.filter(s => 
    filtro === 'todas' ? true : s.estado === filtro
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando solicitudes...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>📝 Solicitudes de Modificación</h1>
        <p className={styles.subtitle}>Gestiona las solicitudes de cambios en pedidos personalizados</p>
      </header>

      {/* Filtros */}
      <div className={styles.filtros}>
        <button
          onClick={() => setFiltro('todas')}
          className={`${styles.filtro} ${filtro === 'todas' ? styles.filtroActivo : ''}`}
        >
          📋 Todas ({solicitudes.length})
        </button>
        <button
          onClick={() => setFiltro('pendiente')}
          className={`${styles.filtro} ${filtro === 'pendiente' ? styles.filtroActivo : ''}`}
        >
          ⏳ Pendientes ({solicitudes.filter(s => s.estado === 'pendiente').length})
        </button>
        <button
          onClick={() => setFiltro('aprobada')}
          className={`${styles.filtro} ${filtro === 'aprobada' ? styles.filtroActivo : ''}`}
        >
          ✅ Aprobadas ({solicitudes.filter(s => s.estado === 'aprobada').length})
        </button>
        <button
          onClick={() => setFiltro('rechazada')}
          className={`${styles.filtro} ${filtro === 'rechazada' ? styles.filtroActivo : ''}`}
        >
          ❌ Rechazadas ({solicitudes.filter(s => s.estado === 'rechazada').length})
        </button>
      </div>

      {/* Lista de solicitudes */}
      <div className={styles.lista}>
        {solicitudesFiltradas.length === 0 ? (
          <div className={styles.empty}>
            <p>No hay solicitudes {filtro !== 'todas' ? `en estado "${filtro}"` : ''}</p>
          </div>
        ) : (
          solicitudesFiltradas.map(solicitud => (
            <div key={solicitud.id} className={styles.solicitudCard}>
              <div className={styles.solicitudHeader}>
                <div className={styles.solicitudInfo}>
                  <h3>Pedido #{solicitud.pedidoId.slice(-6)}</h3>
                  <p className={styles.usuario}>👤 {solicitud.usuarioNombre}</p>
                  <p className={styles.fecha}>
                    📅 {new Date(solicitud.fechaSolicitud).toLocaleString('es-ES')}
                  </p>
                </div>
                <div className={`${styles.estadoBadge} ${styles[solicitud.estado]}`}>
                  {solicitud.estado === 'pendiente' && '⏳ Pendiente'}
                  {solicitud.estado === 'aprobada' && '✅ Aprobada'}
                  {solicitud.estado === 'rechazada' && '❌ Rechazada'}
                </div>
              </div>

              <div className={styles.solicitudBody}>
                <p className={styles.motivoLabel}>Motivo de la solicitud:</p>
                <p className={styles.motivo}>{solicitud.motivo}</p>
                
                {solicitud.mensajeAdmin && (
                  <div className={styles.respuestaAdmin}>
                    <p className={styles.respuestaLabel}>Respuesta del administrador:</p>
                    <p>{solicitud.mensajeAdmin}</p>
                  </div>
                )}
              </div>

              {solicitud.estado === 'pendiente' && (
                <div className={styles.solicitudActions}>
                  <button
                    onClick={() => router.push(`/admin/pedidos-personalizados/${solicitud.pedidoId}`)}
                    className={styles.verPedidoBtn}
                  >
                    👁️ Ver Pedido
                  </button>
                  <button
                    onClick={() => abrirModal(solicitud)}
                    className={styles.responderBtn}
                  >
                    📝 Responder
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal de respuesta */}
      {showModal && solicitudActual && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Responder Solicitud</h2>
            
            <div className={styles.modalInfo}>
              <p><strong>Pedido:</strong> #{solicitudActual.pedidoId.slice(-6)}</p>
              <p><strong>Cliente:</strong> {solicitudActual.usuarioNombre}</p>
              <p><strong>Motivo:</strong></p>
              <p className={styles.modalMotivo}>{solicitudActual.motivo}</p>
            </div>

            <div className={styles.modalForm}>
              <label>Mensaje para el cliente (opcional):</label>
              <textarea
                value={mensajeAdmin}
                onChange={(e) => setMensajeAdmin(e.target.value)}
                placeholder="Escribe un mensaje adicional para el cliente..."
                rows={4}
                className={styles.textarea}
              />
            </div>

            <div className={styles.modalButtons}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSolicitudActual(null);
                  setMensajeAdmin('');
                }}
                className={styles.cancelBtn}
                disabled={procesando}
              >
                Cancelar
              </button>
              <button
                onClick={() => responderSolicitud('rechazar')}
                className={styles.rechazarBtn}
                disabled={procesando}
              >
                ❌ Rechazar
              </button>
              <button
                onClick={() => responderSolicitud('aprobar')}
                className={styles.aprobarBtn}
                disabled={procesando}
              >
                {procesando ? 'Procesando...' : '✅ Aprobar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
