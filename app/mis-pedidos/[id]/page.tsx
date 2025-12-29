'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
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
  fechaAprobacion?: string;
  fechaEnProduccion?: string;
  fechaTerminado?: string;
  fechaEnviado?: string;
  fechaEntregado?: string;
  codigoRastreo?: string;
};

const ESTADOS = {
  PENDIENTE: { label: '⏳ Pendiente', color: '#ff9800' },
  EN_MODIFICACION: { label: '✏️ En Modificación', color: '#ff5722' },
  APROBADO: { label: '✅ Aprobado', color: '#4caf50' },
  ESPERANDO_STOCK: { label: '📋 Esperando Stock', color: '#795548' },
  EN_PRODUCCION: { label: '🏭 En Producción', color: '#2196f3' },
  TERMINADO: { label: '✔️ Terminado', color: '#00bcd4' },
  ENVIADO: { label: '📦 Enviado', color: '#9c27b0' },
  ENTREGADO: { label: '🎉 Entregado', color: '#276b31' },
  CANCELADO: { label: '❌ Cancelado', color: '#dc3545' }
};

// Función para normalizar estados (compatibilidad con backend)
const normalizarEstado = (estado: string): keyof typeof ESTADOS => {
  const estadoUpper = estado.toUpperCase();
  
  const mapeo: Record<string, keyof typeof ESTADOS> = {
    'PENDIENTE': 'PENDIENTE',
    'EN_PROCESO': 'EN_PRODUCCION',
    'DESPACHADO': 'ENVIADO',
    'COMPLETADO': 'ENTREGADO',
    'APROBADO': 'APROBADO',
    'CANCELADO': 'CANCELADO',
    'EN_MODIFICACION': 'EN_MODIFICACION',
    'ESPERANDO_STOCK': 'ESPERANDO_STOCK',
    'EN_PRODUCCION': 'EN_PRODUCCION',
    'TERMINADO': 'TERMINADO',
    'ENVIADO': 'ENVIADO',
    'ENTREGADO': 'ENTREGADO'
  };
  
  return mapeo[estadoUpper] || 'PENDIENTE';
};

const getEstadoInfo = (estado: string) => {
  const estadoNormalizado = normalizarEstado(estado);
  return ESTADOS[estadoNormalizado];
};

export default function PedidoDetallePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const pedidoId = params.id as string;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success'|'error'} | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }
    cargarPedido();
  }, [session, router, pedidoId]);

  const cargarPedido = async () => {
    try {
      console.log('Cargando pedido con ID:', pedidoId);
      const response = await fetch(`/api/personalizacion/pedidos/${pedidoId}`);

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Pedido cargado:', data);
        setPedido(data);
      } else {
        console.error('Error response:', await response.text());
      }
    } catch (error) {
      console.error('Error al cargar el pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelarPedido = async () => {
    if (!pedido) return;
    
    try {
      const response = await fetch(`/api/personalizacion/pedidos/${pedidoId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setToast({message: '✅ Pedido cancelado exitosamente', type: 'success'});
        setTimeout(() => {
          setToast(null);
          router.push('/mis-pedidos'); // Redirigir a lista de pedidos
        }, 2000);
      } else {
        const errorData = await response.json();
        setToast({message: errorData.error || 'Error al cancelar pedido', type: 'error'});
        setTimeout(() => setToast(null), 4000);
      }
    } catch (error) {
      console.error('Error al cancelar pedido:', error);
      setToast({message: 'Error de conexión', type: 'error'});
      setTimeout(() => setToast(null), 4000);
    } finally {
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  if (!pedido) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Pedido no encontrado</h2>
          <button onClick={() => router.push('/mis-pedidos')} className={styles.backBtn}>
            ← Volver a Mis Pedidos
          </button>
        </div>
      </div>
    );
  }

  const estadoNormalizado = normalizarEstado(pedido.estado);

  // Orden cronológico de estados
  const ordenEstados = [
    'PENDIENTE',
    'EN_MODIFICACION',
    'APROBADO',
    'ESPERANDO_STOCK',
    'EN_PRODUCCION',
    'TERMINADO',
    'ENVIADO',
    'ENTREGADO'
  ];

  const indiceEstadoActual = ordenEstados.indexOf(estadoNormalizado);

  // Función para determinar el estado de cada paso del timeline
  const getTimelineState = (estado: string) => {
    const indice = ordenEstados.indexOf(estado);
    if (indice < indiceEstadoActual) return 'completed'; // Rosa - ya pasó
    if (indice === indiceEstadoActual) return 'current'; // Verde - estado actual
    return 'pending'; // Gris - pendiente
  };

  // Función para obtener la fecha correspondiente a cada estado
  const getFechaEstado = (estado: string) => {
    const fechas: Record<string, string | undefined> = {
      'PENDIENTE': pedido.fechaCreacion,
      'APROBADO': pedido.fechaAprobacion,
      'EN_PRODUCCION': pedido.fechaEnProduccion,
      'TERMINADO': pedido.fechaTerminado,
      'ENVIADO': pedido.fechaEnviado,
      'ENTREGADO': pedido.fechaEntregado
    };
    return fechas[estado];
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.push('/mis-pedidos')} className={styles.backBtn}>
          ← Volver
        </button>
        <h1 className={styles.title}>Pedido #{pedido.id.slice(-6)}</h1>
        <div className={styles.headerActions}>
          <button onClick={() => router.push(`/mis-pedidos/${pedido.id}/detalles`)} className={styles.actionBtn}>
            📋 Ver Detalles
          </button>
          <button onClick={() => router.push(`/mis-pedidos/${pedido.id}/conversacion`)} className={styles.actionBtn}>
            💬 Conversación
          </button>
          <button 
            onClick={() => router.push(`/personalizar?pedidoId=${pedido.id}`)} 
            className={styles.editBtn}
          >
            ✏️ Editar Pedido
          </button>
          {(estadoNormalizado === 'PENDIENTE' || estadoNormalizado === 'EN_MODIFICACION') && (
            <button 
              className={styles.cancelBtn}
              onClick={() => setShowConfirmModal(true)}
            >
              ❌ Cancelar Pedido
            </button>
          )}
        </div>
        <div 
          className={styles.estadoBadge}
          style={{ backgroundColor: getEstadoInfo(pedido.estado).color }}
        >
          {getEstadoInfo(pedido.estado).label}
        </div>
      </div>

      {/* Timeline */}
      {estadoNormalizado !== 'CANCELADO' ? (
        <div className={styles.timeline}>
          <div className={`${styles.timelineItem} ${styles[getTimelineState('PENDIENTE')]}`}>
            <div className={styles.timelineIcon}>✓</div>
            <div className={styles.timelineContent}>
              <h4>⏳ Pedido Creado</h4>
              <p>{new Date(pedido.fechaCreacion).toLocaleString('es-ES')}</p>
              <p className={styles.descripcion}>Tu pedido ha sido recibido y está en espera de revisión por nuestro equipo.</p>
            </div>
          </div>

          <div className={`${styles.timelineItem} ${styles[getTimelineState('EN_MODIFICACION')]}`}>
            <div className={styles.timelineIcon}>
              {getTimelineState('EN_MODIFICACION') === 'pending' ? '○' : '✓'}
            </div>
            <div className={styles.timelineContent}>
              <h4>✏️ En Modificación</h4>
              <p>{getFechaEstado('EN_MODIFICACION') ? new Date(getFechaEstado('EN_MODIFICACION')!).toLocaleString('es-ES') : 'Pendiente'}</p>
              <p className={styles.descripcion}>El pedido requiere algunos ajustes. Te contactaremos para coordinar los cambios necesarios.</p>
            </div>
          </div>

          <div className={`${styles.timelineItem} ${styles[getTimelineState('APROBADO')]}`}>
            <div className={styles.timelineIcon}>
              {getTimelineState('APROBADO') === 'pending' ? '○' : '✓'}
            </div>
            <div className={styles.timelineContent}>
              <h4>✅ Aprobado</h4>
              <p>{pedido.fechaAprobacion ? new Date(pedido.fechaAprobacion).toLocaleString('es-ES') : 'Pendiente'}</p>
              <p className={styles.descripcion}>Tu pedido ha sido aprobado y confirmamos que podemos realizarlo según tus especificaciones.</p>
            </div>
          </div>

          <div className={`${styles.timelineItem} ${styles[getTimelineState('ESPERANDO_STOCK')]}`}>
            <div className={styles.timelineIcon}>
              {getTimelineState('ESPERANDO_STOCK') === 'pending' ? '○' : '✓'}
            </div>
            <div className={styles.timelineContent}>
              <h4>📋 Esperando Stock</h4>
              <p>{getFechaEstado('ESPERANDO_STOCK') ? new Date(getFechaEstado('ESPERANDO_STOCK')!).toLocaleString('es-ES') : 'Pendiente'}</p>
              <p className={styles.descripcion}>Estamos consiguiendo las telas y materiales necesarios para tu cartera.</p>
            </div>
          </div>

          <div className={`${styles.timelineItem} ${styles[getTimelineState('EN_PRODUCCION')]}`}>
            <div className={styles.timelineIcon}>
              {getTimelineState('EN_PRODUCCION') === 'pending' ? '○' : '✓'}
            </div>
            <div className={styles.timelineContent}>
              <h4>🏭 En Producción</h4>
              <p>{pedido.fechaEnProduccion ? new Date(pedido.fechaEnProduccion).toLocaleString('es-ES') : 'Pendiente'}</p>
              <p className={styles.descripcion}>Tu cartera está siendo fabricada con los materiales y diseño que elegiste.</p>
            </div>
          </div>

          <div className={`${styles.timelineItem} ${styles[getTimelineState('TERMINADO')]}`}>
            <div className={styles.timelineIcon}>
              {getTimelineState('TERMINADO') === 'pending' ? '○' : '✓'}
            </div>
            <div className={styles.timelineContent}>
              <h4>✔️ Terminado</h4>
              <p>{pedido.fechaTerminado ? new Date(pedido.fechaTerminado).toLocaleString('es-ES') : 'Pendiente'}</p>
              <p className={styles.descripcion}>Tu cartera está lista y empaquetada, preparada para ser enviada.</p>
            </div>
          </div>

          <div className={`${styles.timelineItem} ${styles[getTimelineState('ENVIADO')]}`}>
            <div className={styles.timelineIcon}>
              {getTimelineState('ENVIADO') === 'pending' ? '○' : '✓'}
            </div>
            <div className={styles.timelineContent}>
              <h4>📦 Enviado</h4>
              <p>{pedido.fechaEnviado ? new Date(pedido.fechaEnviado).toLocaleString('es-ES') : 'Pendiente'}</p>
              {pedido.codigoRastreo && (
                <p className={styles.tracking}>📦 Código: {pedido.codigoRastreo}</p>
              )}
              <p className={styles.descripcion}>Tu pedido ha sido despachado y está en camino a tu dirección.</p>
            </div>
          </div>

          <div className={`${styles.timelineItem} ${styles[getTimelineState('ENTREGADO')]}`}>
            <div className={styles.timelineIcon}>
              {getTimelineState('ENTREGADO') === 'pending' ? '○' : '✓'}
            </div>
            <div className={styles.timelineContent}>
              <h4>🎉 Entregado</h4>
              <p>{pedido.fechaEntregado ? new Date(pedido.fechaEntregado).toLocaleString('es-ES') : 'Pendiente'}</p>
              <p className={styles.descripcion}>¡Tu cartera personalizada ha llegado a tus manos! Esperamos que la disfrutes.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.canceladoBanner}>
          <h3>❌ Pedido Cancelado</h3>
          <p>Este pedido fue cancelado y no continuará en el proceso de producción.</p>
        </div>
      )}

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmModal}>
            <h3>¿Cancelar este pedido?</h3>
            <p>Esta acción no se puede deshacer. El pedido será marcado como cancelado.</p>
            <div className={styles.modalButtons}>
              <button onClick={cancelarPedido} className={styles.confirmBtn}>
                Sí, cancelar
              </button>
              <button onClick={() => setShowConfirmModal(false)} className={styles.cancelModalBtn}>
                No, mantener
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
