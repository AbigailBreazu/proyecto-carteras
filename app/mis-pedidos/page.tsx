'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './mis-pedidos.module.css';

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
  
  // Mapeo de estados antiguos a nuevos
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

// Función helper para obtener info del estado
const getEstadoInfo = (estado: string) => {
  const estadoNormalizado = normalizarEstado(estado);
  return ESTADOS[estadoNormalizado];
};

export default function MisPedidosPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }
    cargarPedidos();
    
    // Escuchar evento de mensajes leídos para actualizar los contadores
    const handleMensajesLeidos = () => {
      cargarPedidos();
    };
    window.addEventListener('mensajesLeidos', handleMensajesLeidos);
    
    return () => {
      window.removeEventListener('mensajesLeidos', handleMensajesLeidos);
    };
  }, [session, router]);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/personalizacion/pedidos');
      const data = await response.json();
      setPedidos(data);
      
      // Cargar mensajes no leídos para cada pedido
      cargarMensajesNoLeidos(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  const cargarMensajesNoLeidos = async (pedidosData: Pedido[]) => {
    const contadores: Record<string, number> = {};
    
    for (const pedido of pedidosData) {
      try {
        const mensajesRes = await fetch(`/api/personalizacion/pedidos/${pedido.id}/mensajes`);
        if (mensajesRes.ok) {
          const mensajes = await mensajesRes.json();
          const noLeidos = mensajes.filter((m: any) => m.esAdmin && !m.leido).length;
          
          if (noLeidos > 0) {
            contadores[pedido.id] = noLeidos;
          }
        }
      } catch (error) {
        console.error(`Error cargando mensajes del pedido ${pedido.id}:`, error);
      }
    }
    
    setMensajesNoLeidos(contadores);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando tus pedidos...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>Mis Pedidos Personalizados</h1>
            <p className={styles.subtitle}>Revisa el estado de tus pedidos de carteras personalizadas</p>
          </div>
          <button onClick={() => router.push('/personalizar')} className={styles.createBtn}>
            ➕ Nuevo Pedido
          </button>
        </div>
      </header>

      {pedidos.length === 0 ? (
        <div className={styles.empty}>
          <p>No tienes pedidos personalizados aún</p>
          <button onClick={() => router.push('/personalizar')} className={styles.createBtnLarge}>
            🎨 Crear Pedido Personalizado
          </button>
        </div>
      ) : (
        <div className={styles.pedidosList}>
          {pedidos.map(pedido => (
            <div 
              key={pedido.id} 
              className={styles.card}
              onClick={() => router.push(`/mis-pedidos/${pedido.id}`)}
            >
              <div className={styles.cardContent}>
                <div className={styles.cardLeft}>
                  <span className={styles.pedidoId}>
                    {pedido.disenoPropio ? '🎨 Diseño Personalizado' : '📋 Modelo del Catálogo'}
                  </span>
                  <span className={styles.fecha}>
                    {new Date(pedido.fechaCreacion).toLocaleDateString('es-ES', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                
                <div className={styles.cardCenter}>
                  <div className={styles.pedidoInfo}>
                    <span>{pedido.telasSeleccionadas.length} tela{pedido.telasSeleccionadas.length !== 1 ? 's' : ''}</span>
                    {pedido.disenoPropio && <span className={styles.iconoDiseno}>🎨 Diseño propio</span>}
                  </div>
                </div>

                <div className={styles.cardRight}>
                  <div className={styles.estadoContainer}>
                    <span
                      className={styles.badge}
                      style={{ backgroundColor: getEstadoInfo(pedido.estado).color }}
                    >
                      {getEstadoInfo(pedido.estado).label}
                    </span>
                    {mensajesNoLeidos[pedido.id] && (
                      <span className={styles.mensajeBadge}>
                        💬 {mensajesNoLeidos[pedido.id]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
