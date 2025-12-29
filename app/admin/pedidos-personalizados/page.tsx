'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './pedidos-personalizados.module.css';

type Pedido = {
  id: string;
  userEmail: string;
  userName: string;
  disenoBase: string | null;
  disenoPropio: string | null;
  telasSeleccionadas: string[];
  comentarios: string;
  estado: 'PENDIENTE' | 'EN_MODIFICACION' | 'APROBADO' | 'ESPERANDO_STOCK' | 'EN_PRODUCCION' | 'TERMINADO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
  activo?: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
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
  const estadoUpper = estado.toUpperCase().replace(/_/g, '_');
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

export default function PedidosPersonalizadosPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<Pedido['estado'] | 'TODOS'>('TODOS');
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pedidoToArchive, setPedidoToArchive] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/personalizacion/pedidos');
      const data = await response.json();
      
      // Normalizar datos del backend al formato del frontend
      const pedidosNormalizados = data.map((p: any) => ({
        id: p.id,
        userEmail: p.usuarioEmail || p.userEmail,
        userName: p.usuarioNombre || p.userName,
        disenoBase: p.disenoBase?.id || p.disenoBase,
        disenoPropio: p.disenoPropio,
        telasSeleccionadas: Array.isArray(p.telas) 
          ? p.telas.map((t: any) => t.id || t.nombre || t)
          : Array.isArray(p.telasSeleccionadas) 
          ? p.telasSeleccionadas 
          : [],
        comentarios: p.comentarios,
        estado: normalizarEstado(p.estado),
        fechaCreacion: p.fechaCreacion,
        fechaActualizacion: p.fechaActualizacion
      }));
      
      setPedidos(pedidosNormalizados);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }
    cargarPedidos();
  }, [session, router]);

  const archivarPedido = async () => {
    if (!pedidoToArchive) return;

    try {
      const response = await fetch(`/api/personalizacion/pedidos/${pedidoToArchive}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'cancelado' })
      });

      if (response.ok) {
        showToast('Pedido archivado exitosamente', 'success');
        cargarPedidos();
      } else {
        showToast('Error al archivar pedido', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al archivar pedido', 'error');
    } finally {
      setShowConfirmModal(false);
      setPedidoToArchive(null);
    }
  };

  const pedidosFiltrados = filtro === 'TODOS' 
    ? pedidos.filter(p => p.estado !== 'CANCELADO')
    : pedidos.filter(p => p.estado === filtro);

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando pedidos...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Pedidos Personalizados</h1>

      <div className={styles.filtros}>
        <button
          onClick={() => setFiltro('TODOS')}
          className={filtro === 'TODOS' ? styles.filtroActivo : styles.filtro}
        >
          📋 TODOS ({pedidos.filter(p => p.estado !== 'CANCELADO').length})
        </button>
        {Object.entries(ESTADOS)
          .filter(([key]) => key !== 'CANCELADO')
          .map(([key, value]) => (
          <button
            key={key}
            onClick={() => setFiltro(key as Pedido['estado'] | 'TODOS')}
            className={filtro === key ? styles.filtroActivo : styles.filtro}
          >
            {value.label} ({pedidos.filter(p => p.estado === key).length})
          </button>
        ))}
        <button
          onClick={() => setFiltro('CANCELADO')}
          className={filtro === 'CANCELADO' ? styles.filtroActivo : styles.filtro}
        >
          🗑️ ARCHIVADOS ({pedidos.filter(p => p.estado === 'CANCELADO').length})
        </button>
      </div>

      <div className={styles.tableWrapper}>
        {pedidosFiltrados.length === 0 ? (
          <div className={styles.empty}>No hay pedidos en esta categoría</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Diseño</th>
                <th>Telas</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidosFiltrados.map(pedido => (
                <tr key={pedido.id}>
                  <td>#{pedido.id.slice(-6)}</td>
                  <td>
                    <strong>{pedido.userName}</strong>
                    <br />
                    <small>{pedido.userEmail}</small>
                  </td>
                  <td>
                    {pedido.disenoPropio ? '🎨 Propio' : '📋 Base'}
                  </td>
                  <td>{pedido.telasSeleccionadas.length} telas</td>
                  <td>
                    <span
                      className={styles.badge}
                      style={{ backgroundColor: ESTADOS[pedido.estado].color }}
                    >
                      {ESTADOS[pedido.estado].label}
                    </span>
                  </td>
                  <td>{new Date(pedido.fechaCreacion).toLocaleDateString()}</td>
                  <td>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      <button
                        className={styles.detailBtn}
                        onClick={() => router.push(`/admin/pedidos-personalizados/${pedido.id}`)}
                      >
                        ✏️ Modificar
                      </button>
                      <button
                        className={styles.archiveBtn}
                        onClick={() => {
                          setPedidoToArchive(pedido.id);
                          setShowConfirmModal(true);
                        }}
                        title="Archivar pedido"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de confirmación de archivado */}
      {showConfirmModal && pedidoToArchive && (
        <div className={styles.modalOverlay} onClick={() => setShowConfirmModal(false)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <h3>¿Archivar pedido?</h3>
            <p>No se eliminará permanentemente, solo dejará de aparecer en la lista.</p>
            <p>Todos los datos del pedido se conservarán.</p>
            <div className={styles.confirmButtons}>
              <button 
                className={styles.cancelBtn}
                onClick={() => {
                  setShowConfirmModal(false);
                  setPedidoToArchive(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className={styles.confirmBtn}
                onClick={archivarPedido}
              >
                Sí, archivar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={styles.toast} style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          backgroundColor: toast.type === 'success' ? '#4CAF50' : '#f44336',
          color: 'white',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 10000,
          animation: 'slideIn 0.3s ease'
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
