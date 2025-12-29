'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import styles from './detalles.module.css';

type Pedido = {
  id: string;
  usuarioEmail?: string;
  usuarioNombre?: string;
  userEmail?: string;
  userName?: string;
  disenoBase: string | { id: string; nombre: string; imagenes?: string[]; imagenPrincipal?: string } | null;
  disenoPropio: string | null;
  telasSeleccionadas: string[];
  telas: any[];
  comentarios: string;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion: string;
};

type Tela = {
  id: string;
  nombre: string;
  url: string;
  categoria: string;
  especialPara?: string;
  elasticidad: string;
  lavable: string;
  fechaCreacion: string;
};

function normalizeUrl(url: string): string {
  if (!url) return url;
  
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
  
  console.log('🔧 Normalizando URL original:', url);
  
  // Si la URL ya es completa del backend, limpiar y devolverla
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Limpiar múltiples slashes consecutivos
    let cleaned = url.replace(/([^:])\/\//g, '$1/');
    console.log('✅ URL completa limpiada:', cleaned);
    return cleaned;
  }
  
  // Si es una ruta relativa, construir URL completa del backend
  let cleaned = url.replace(/^\/+/, '').replace(/\/\/+/g, '/');
  
  // Si no empieza con uploads/, agregarlo según el tipo
  if (!cleaned.startsWith('uploads/')) {
    if (cleaned.startsWith('telas/') || cleaned.startsWith('disenos-base/') || cleaned.startsWith('disenos/')) {
      cleaned = `uploads/${cleaned}`;
    } else if (!cleaned.includes('/')) {
      // Si es solo un filename, va a uploads/images/
      cleaned = `uploads/images/${cleaned}`;
    }
  }
  
  const fullUrl = `${BACKEND_URL}/${cleaned}`;
  console.log('✅ URL completa construida:', fullUrl);
  return fullUrl;
}

export default function PedidoDetallesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const pedidoId = params.id as string;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [telas, setTelas] = useState<Tela[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push('/login');
      return;
    }
    cargarPedido();
  }, [session, router, pedidoId]);

  const cargarPedido = async () => {
    try {
      const [pedidoRes, telasRes] = await Promise.all([
        fetch(`/api/personalizacion/pedidos/${pedidoId}`),
        fetch('/api/personalizacion/telas')
      ]);

      if (pedidoRes.ok) {
        const data = await pedidoRes.json();
        console.log('📦 Pedido cargado:', data);
        console.log('🎨 telasSeleccionadas:', data.telasSeleccionadas);
        console.log('📐 disenoBase:', data.disenoBase);
        console.log('📐 tipo disenoBase:', typeof data.disenoBase);
        if (typeof data.disenoBase === 'object' && data.disenoBase) {
          console.log('📐 disenoBase.imagenes:', data.disenoBase.imagenes);
          console.log('📐 disenoBase.nombre:', data.disenoBase.nombre);
        }
        setPedido(data);
      }

      if (telasRes.ok) {
        const telasData = await telasRes.json();
        console.log('🧵 Telas cargadas:', telasData);
        setTelas(telasData);
      }
    } catch (error) {
      console.error('Error al cargar el pedido:', error);
    } finally {
      setLoading(false);
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.push(`/mis-pedidos/${pedidoId}`)} className={styles.backBtn}>
          ← Volver al Pedido
        </button>
        <h1 className={styles.title}>Detalles - Pedido #{pedido.id.slice(-6)}</h1>
      </div>

      <div className={styles.content}>
        {/* Diseño Personalizado con Detalles */}
        <div className={styles.section}>
          <h2>Diseño Solicitado</h2>
          <div className={styles.disenoConDetalles}>
            {/* Imagen del diseño */}
            <div className={styles.disenoImagenContainer}>
              {pedido.disenoPropio ? (
                <>
                  <h3 className={styles.disenoTitulo}>Diseño Personalizado</h3>
                  <div className={styles.disenoImagenWrapper}>
                    <img 
                      src={normalizeUrl(pedido.disenoPropio)}
                      alt="Diseño Personalizado" 
                      className={styles.disenoImagen}
                      onError={(e) => {
                        console.error('❌ Error cargando diseño propio:', e.currentTarget.src);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => console.log('✅ Diseño propio cargado exitosamente')}
                    />
                  </div>
                </>
              ) : pedido.disenoBase ? (
                <>
                  <h3 className={styles.disenoTitulo}>Modelo del Catálogo</h3>
                  {(() => {
                    const disenoObj = typeof pedido.disenoBase === 'object' ? pedido.disenoBase : null;
                    console.log('🎨 Renderizando disenoBase, objeto:', disenoObj);
                    
                    if (disenoObj) {
                      // Intentar obtener imágenes de diferentes campos posibles
                      const imagenes = disenoObj.imagenes || (disenoObj.imagenPrincipal ? [disenoObj.imagenPrincipal] : null);
                      console.log('🖼️ Imágenes encontradas:', imagenes);
                      
                      if (imagenes && imagenes.length > 0) {
                        return (
                          <div className={styles.disenoImagenWrapper}>
                            {imagenes.length === 1 ? (
                              (() => {
                                const imgUrl = imagenes[0];
                                const finalUrl = normalizeUrl(imgUrl);
                                console.log('🖼️ URL final para renderizar (1 imagen):', finalUrl);
                                return (
                                  <img 
                                    src={finalUrl}
                                    alt={disenoObj.nombre}
                                    className={styles.disenoImagen}
                                    onError={(e) => {
                                      console.error('❌ Error cargando imagen:', e.currentTarget.src);
                                      e.currentTarget.style.display = 'none';
                                    }}
                                    onLoad={() => console.log('✅ Imagen cargada exitosamente:', finalUrl)}
                                  />
                                );
                              })()
                            ) : (
                              <div className={styles.carruselContainer}>
                                {imagenes.map((img, idx) => {
                                  const finalUrl = normalizeUrl(img);
                                  console.log(`🖼️ URL final para renderizar imagen ${idx + 1}:`, finalUrl);
                                  return (
                                    <img 
                                      key={idx}
                                      src={finalUrl}
                                      alt={`${disenoObj.nombre} - ${idx + 1}`}
                                      className={styles.disenoImagen}
                                      style={{ marginBottom: idx < imagenes.length - 1 ? '1rem' : '0' }}
                                      onError={(e) => {
                                        console.error('❌ Error cargando imagen:', e.currentTarget.src);
                                        e.currentTarget.style.display = 'none';
                                      }}
                                      onLoad={() => console.log('✅ Imagen cargada exitosamente:', finalUrl)}
                                    />
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }
                    }
                    
                    // Fallback: mostrar nombre o string
                    return (
                      <div className={styles.disenoBaseWrapper}>
                        <div className={styles.modeloIcon}>📐</div>
                        <p className={styles.disenoBaseName}>
                          {typeof pedido.disenoBase === 'string' ? pedido.disenoBase : disenoObj?.nombre || 'Diseño base'}
                        </p>
                      </div>
                    );
                  })()}
                </>
              ) : null}
            </div>

            {/* Detalles del diseño */}
            <div className={styles.detallesDiseno}>
              <h3 className={styles.detallesTitulo}>Detalles del Diseño</h3>
              
              <div className={styles.detalleItem}>
                <strong>Tipo:</strong>
                <span>{pedido.disenoPropio ? 'Diseño personalizado subido por el cliente' : 'Modelo del catálogo seleccionado'}</span>
              </div>

              {pedido.comentarios && (
                <div className={styles.detalleItem}>
                  <strong>Especificaciones del cliente:</strong>
                  <ul className={styles.especificacionesList}>
                    {pedido.comentarios.split('\n').filter(line => line.trim()).map((line, idx) => (
                      <li key={idx}>{line.trim()}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={styles.detalleItem}>
                <strong>ID del pedido:</strong>
                <span>#{pedido.id.slice(-6)}</span>
              </div>

              <div className={styles.detalleItem}>
                <strong>Fecha de solicitud:</strong>
                <span>{new Date(pedido.fechaCreacion).toLocaleString('es-ES', { 
                  day: '2-digit', 
                  month: 'long', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Telas Seleccionadas */}
        <div className={styles.section}>
          <h2>Telas Seleccionadas</h2>
          {pedido.telas && pedido.telas.length > 0 ? (
            pedido.telas.map((tela: any, idx: number) => {
              console.log(`🧵 Procesando tela ${idx + 1}:`, tela);
              const telaUrl = tela.imagenPrincipal || tela.url || tela.imagen || tela.id;
              console.log(`🖼️ URL de tela ${idx + 1}:`, telaUrl);
              return (
                <div key={idx} className={styles.disenoConDetalles} style={{ marginBottom: idx < pedido.telas.length - 1 ? '2rem' : '0' }}>
                {/* Imagen de la tela */}
                <div className={styles.disenoImagenContainer}>
                  <h3 className={styles.disenoTitulo}>{tela.nombre || 'Tela'}</h3>
                  <div className={styles.disenoImagenWrapper}>
                    <img 
                      src={normalizeUrl(telaUrl)}
                      alt={tela.nombre || telaUrl}
                      className={styles.disenoImagen}
                      onError={(e) => {
                        console.error('❌ Error cargando tela:', e.currentTarget.src);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => console.log('✅ Tela cargada exitosamente')}
                    />
                  </div>
                </div>

                {/* Detalles de la tela */}
                <div className={styles.detallesDiseno}>
                  <h3 className={styles.detallesTitulo}>Detalles de la Tela</h3>
                  
                  {tela ? (
                    <>
                      <div className={styles.detalleItem}>
                        <strong>Categoría:</strong>
                        <span>{tela.categoria || 'N/A'}</span>
                      </div>

                      {tela.especialPara && (
                        <div className={styles.detalleItem}>
                          <strong>Ideal para:</strong>
                          <span>{tela.especialPara}</span>
                        </div>
                      )}

                      <div className={styles.detalleItem}>
                        <strong>Elasticidad:</strong>
                        <span>{tela.elasticidad === 'si' ? 'Sí' : tela.elasticidad === 'no' ? 'No' : 'Media'}</span>
                      </div>

                      <div className={styles.detalleItem}>
                        <strong>Lavable:</strong>
                        <span>{tela.lavable === 'si' ? 'Sí' : tela.lavable === 'no' ? 'No' : 'Con cuidado'}</span>
                      </div>

                      {tela.fechaCreacion && (
                        <div className={styles.detalleItem}>
                          <strong>Fecha de registro:</strong>
                          <span>{new Date(tela.fechaCreacion).toLocaleDateString('es-ES', { 
                            day: '2-digit', 
                            month: 'long', 
                            year: 'numeric'
                          })}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.detalleItem}>
                      <span>No hay información detallada disponible para esta tela.</span>
                    </div>
                  )}
                </div>
              </div>
              );
            })
          ) : null}
        </div>

        {/* Información del Cliente */}
        <div className={styles.section}>
          <h2>Información del Cliente</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <strong>Última actualización:</strong>
              <span>{new Date(pedido.fechaActualizacion).toLocaleString('es-ES', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
