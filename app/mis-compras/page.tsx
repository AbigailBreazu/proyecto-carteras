'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './mis-compras.module.css';

type ItemCompra = {
  producto_id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
};

type Compra = {
  id: string;
  usuario_email: string;
  items: ItemCompra[];
  total: number;
  estado: string;
  fecha_creacion: string;
  mercadopago_payment_id?: string;
  mercadopago_status?: string;
};

const ESTADOS_COMPRA = {
  PENDIENTE: { label: '⏳ Pendiente de Pago', color: '#ff9800' },
  PAGADO: { label: '✅ Pagado', color: '#4caf50' },
  PROCESANDO: { label: '📦 Procesando', color: '#2196f3' },
  ENVIADO: { label: '🚚 Enviado', color: '#9c27b0' },
  ENTREGADO: { label: '🎉 Entregado', color: '#276b31' },
  CANCELADO: { label: '❌ Cancelado', color: '#dc3545' }
};

export default function MisComprasPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [compras, setCompras] = useState<Compra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }
    cargarCompras();
  }, [session, router]);

  const cargarCompras = async () => {
    try {
      setLoading(true);
      console.log('🛍️ Cargando compras...');
      
      const response = await fetch('/api/compras');
      
      console.log('📥 Respuesta /api/compras:', response.status);
      
      if (!response.ok) {
        console.error('❌ Error en respuesta:', response.statusText);
        throw new Error('Error al cargar compras');
      }
      
      const data = await response.json();
      console.log('📋 Compras recibidas:', data);
      console.log('📊 Total de compras:', data.length);
      
      setCompras(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar tus compras');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoInfo = (estado: string) => {
    const estadoUpper = estado.toUpperCase();
    return ESTADOS_COMPRA[estadoUpper as keyof typeof ESTADOS_COMPRA] || ESTADOS_COMPRA.PENDIENTE;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando tus compras...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>Mis Compras</h1>
            <p className={styles.subtitle}>Revisa el estado de tus compras realizadas</p>
          </div>
          <button onClick={() => router.push('/productos')} className={styles.createBtn}>
            🛍️ Seguir Comprando
          </button>
        </div>
      </header>

      {compras.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🛒</div>
          <h2>No tienes compras aún</h2>
          <p>Explora nuestros productos y realiza tu primera compra</p>
          <button onClick={() => router.push('/productos')} className={styles.emptyBtn}>
            Ver Productos
          </button>
        </div>
      ) : (
        <div className={styles.comprasList}>
          {compras.map((compra) => {
            const estadoInfo = getEstadoInfo(compra.estado);
            return (
              <div key={compra.id} className={styles.compraCard}>
                <div className={styles.compraHeader}>
                  <div className={styles.compraInfo}>
                    <h3 className={styles.compraId}>Compra #{compra.id.slice(-8)}</h3>
                    <p className={styles.compraFecha}>
                      {new Date(compra.fecha_creacion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div 
                    className={styles.estadoBadge}
                    style={{ backgroundColor: estadoInfo.color }}
                  >
                    {estadoInfo.label}
                  </div>
                </div>

                <div className={styles.itemsList}>
                  <h4 className={styles.itemsTitle}>Productos:</h4>
                  {compra.items.map((item, idx) => (
                    <div key={idx} className={styles.item}>
                      <div className={styles.itemInfo}>
                        <span className={styles.itemNombre}>{item.nombre}</span>
                        <span className={styles.itemCantidad}>x{item.cantidad}</span>
                      </div>
                      <span className={styles.itemPrecio}>
                        ${(item.precio_unitario * item.cantidad).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className={styles.compraFooter}>
                  <div className={styles.total}>
                    <span className={styles.totalLabel}>Total:</span>
                    <span className={styles.totalMonto}>${compra.total.toFixed(2)}</span>
                  </div>
                  
                  {compra.mercadopago_payment_id && (
                    <div className={styles.paymentInfo}>
                      <span className={styles.paymentLabel}>ID de Pago:</span>
                      <span className={styles.paymentId}>{compra.mercadopago_payment_id}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
