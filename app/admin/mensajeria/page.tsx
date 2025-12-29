'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './mensajeria.module.css';

type EstadoPedido = 'PENDIENTE' | 'EN_MODIFICACION' | 'APROBADO' | 'ESPERANDO_STOCK' | 'EN_PRODUCCION' | 'TERMINADO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';

type Pedido = {
  id: string;
  userName: string;
  userEmail: string;
  estado: EstadoPedido;
  mensajesNoLeidos: number;
  ultimoMensaje?: {
    mensaje: string;
    fecha: string;
    esAdmin: boolean;
  };
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

const normalizarEstado = (estado: string): EstadoPedido => {
  const estadoUpper = estado.toUpperCase().replace(/-/g, '_');
  const mapeo: Record<string, EstadoPedido> = {
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

export default function MensajeriaAdminPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<EstadoPedido | 'TODOS' | 'NO_LEIDOS'>('TODOS');

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }
    cargarPedidos();
    
    // Recargar cada 15 segundos
    const interval = setInterval(cargarPedidos, 15000);
    return () => clearInterval(interval);
  }, [session, router]);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/mensajeria/pedidos');
      
      if (!response.ok) return;

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        // Normalizar estados del backend
        const pedidosNormalizados = data.map((p: any) => ({
          ...p,
          estado: normalizarEstado(p.estado)
        }));
        setPedidos(pedidosNormalizados);
      }
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const pedidosFiltrados = filtro === 'NO_LEIDOS' 
    ? pedidos.filter(p => p.mensajesNoLeidos > 0)
    : filtro === 'TODOS'
    ? pedidos.filter(p => p.estado !== 'CANCELADO')
    : pedidos.filter(p => p.estado === filtro);

  const totalNoLeidos = pedidos.reduce((acc, p) => acc + p.mensajesNoLeidos, 0);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando conversaciones...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>💬 Mensajería de Pedidos</h1>
          <p className={styles.subtitle}>Gestiona las conversaciones con los clientes</p>
        </div>
        {totalNoLeidos > 0 && (
          <div className={styles.badge}>{totalNoLeidos} sin leer</div>
        )}
      </header>

      <div className={styles.filters}>
        <button
          className={`${styles.filterBtn} ${filtro === 'TODOS' ? styles.active : ''}`}
          onClick={() => setFiltro('TODOS')}
        >
          📋 Todos ({pedidos.filter(p => p.estado !== 'CANCELADO').length})
        </button>
        <button
          className={`${styles.filterBtn} ${filtro === 'NO_LEIDOS' ? styles.active : ''}`}
          onClick={() => setFiltro('NO_LEIDOS')}
        >
          🔔 No Leídos ({pedidos.filter(p => p.mensajesNoLeidos > 0).length})
        </button>
        {Object.entries(ESTADOS)
          .filter(([key]) => key !== 'CANCELADO')
          .map(([key, value]) => (
          <button
            key={key}
            className={`${styles.filterBtn} ${filtro === key ? styles.active : ''}`}
            onClick={() => setFiltro(key as EstadoPedido)}
          >
            {value.label} ({pedidos.filter(p => p.estado === key).length})
          </button>
        ))}
        <button
          className={`${styles.filterBtn} ${filtro === 'CANCELADO' ? styles.active : ''}`}
          onClick={() => setFiltro('CANCELADO')}
        >
          🗑️ Archivados ({pedidos.filter(p => p.estado === 'CANCELADO').length})
        </button>
      </div>

      {pedidosFiltrados.length === 0 ? (
        <div className={styles.empty}>
          <p>📭 No hay conversaciones en esta categoría</p>
        </div>
      ) : (
        <div className={styles.conversacionesList}>
          {pedidosFiltrados.map((pedido) => (
            <Link
              key={pedido.id}
              href={`/admin/mensajeria/${pedido.id}`}
              className={`${styles.conversacionCard} ${pedido.mensajesNoLeidos > 0 ? styles.noLeido : ''}`}
            >
              <div className={styles.cardHeader}>
                <div className={styles.clienteInfo}>
                  <h3 className={styles.clienteNombre}>{pedido.userName}</h3>
                  <p className={styles.clienteEmail}>{pedido.userEmail}</p>
                </div>
                {pedido.mensajesNoLeidos > 0 && (
                  <div className={styles.badgeNoLeido}>{pedido.mensajesNoLeidos}</div>
                )}
              </div>

              <div className={styles.pedidoInfo}>
                <span className={styles.pedidoId}>Pedido #{pedido.id.slice(-6)}</span>
                <span className={styles.estadoBadge}>{pedido.estado}</span>
              </div>

              {pedido.ultimoMensaje && (
                <div className={styles.ultimoMensaje}>
                  <span className={styles.mensajeAutor}>
                    {pedido.ultimoMensaje.esAdmin ? '🏢 Tú: ' : '👤 Cliente: '}
                  </span>
                  <span className={styles.mensajeTexto}>
                    {pedido.ultimoMensaje.mensaje.length > 80
                      ? pedido.ultimoMensaje.mensaje.substring(0, 80) + '...'
                      : pedido.ultimoMensaje.mensaje}
                  </span>
                  <span className={styles.mensajeFecha}>
                    {new Date(pedido.ultimoMensaje.fecha).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
