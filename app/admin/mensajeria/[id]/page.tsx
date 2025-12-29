'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './conversacion-admin.module.css';

type Mensaje = {
  id: string;
  pedidoId: string;
  mensaje: string;
  esAdmin: boolean;
  cambioEstado?: {
    estadoAnterior: string;
    estadoNuevo: string;
  };
  leido: boolean;
  fecha: string;
  imagenUrl?: string;
};

type Pedido = {
  id: string;
  userEmail: string;
  userName: string;
  estado: string;
  disenoBase: string | null;
  disenoPropio: string | null;
  telasSeleccionadas: string[];
};

export default function ConversacionAdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const pedidoId = params.id as string;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Estados para manejo de imágenes
  const [imagenSeleccionada, setImagenSeleccionada] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }
    cargarDatos();
    
    // Recargar mensajes cada 10 segundos
    const interval = setInterval(cargarMensajes, 10000);
    return () => clearInterval(interval);
  }, [session, router, pedidoId]);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar pedido
      const pedidoRes = await fetch(`/api/personalizacion/pedidos/${pedidoId}`);
      if (pedidoRes.ok) {
        const pedidoData = await pedidoRes.json();
        setPedido(pedidoData);
      }

      await cargarMensajes();

    } catch (error) {
      console.error('Error al cargar datos:', error);
      showToast('Error al cargar la conversación', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cargarMensajes = async () => {
    try {
      const response = await fetch(`/api/personalizacion/pedidos/${pedidoId}/mensajes`);
      
      if (!response.ok) return;

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        
        // Filtrar mensajes duplicados por ID
        const mensajesUnicos = Array.isArray(data) 
          ? data.filter((mensaje: Mensaje, index: number, self: Mensaje[]) => 
              index === self.findIndex((m) => m.id === mensaje.id)
            )
          : [];
        
        setMensajes(mensajesUnicos);
        
        // Marcar mensajes DEL CLIENTE como leídos por el admin (no los del admin)
        if (mensajesUnicos.length > 0) {
          const mensajesClienteNoLeidos = mensajesUnicos.filter((m: Mensaje) => !m.esAdmin && !m.leido);
          if (mensajesClienteNoLeidos.length > 0) {
            await marcarMensajesComoLeidos(mensajesClienteNoLeidos.map((m: Mensaje) => m.id));
            // Actualizar el estado local inmediatamente
            setMensajes(prev => prev.map(m => 
              mensajesClienteNoLeidos.find(mc => mc.id === m.id) ? { ...m, leido: true } : m
            ));
          }
        }
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const marcarMensajesComoLeidos = async (mensajeIds: string[]) => {
    try {
      console.log('📬 Marcando mensajes como leídos:', mensajeIds);
      
      const response = await fetch(`/api/personalizacion/pedidos/${pedidoId}/mensajes/marcar-leidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensajeIds })
      });
      
      if (response.ok) {
        console.log('✅ Mensajes marcados como leídos exitosamente');
        // Disparar evento para actualizar notificaciones en navbar
        console.log('📡 Disparando evento mensajesLeidos');
        window.dispatchEvent(new Event('mensajesLeidos'));
      } else {
        console.error('❌ Error al marcar mensajes:', response.status);
      }
    } catch (error) {
      console.error('Error al marcar mensajes como leídos:', error);
    }
  };

  // Funciones de cámara
  const abrirCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMostrarCamara(true);
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      showToast('No se pudo acceder a la cámara', 'error');
    }
  };

  const cerrarCamara = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setMostrarCamara(false);
  };

  const capturarFoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setImagenSeleccionada(file);
        setImagenPreview(URL.createObjectURL(file));
        cerrarCamara();
      }
    }, 'image/jpeg', 0.95);
  };

  const seleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('La imagen no puede superar los 10MB', 'error');
        return;
      }
      setImagenSeleccionada(file);
      setImagenPreview(URL.createObjectURL(file));
    }
  };

  const eliminarImagen = () => {
    setImagenSeleccionada(null);
    setImagenPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!nuevoMensaje.trim() && !imagenSeleccionada) || enviando) return;

    setEnviando(true);

    try {
      let response;
      
      if (imagenSeleccionada) {
        // Enviar con imagen usando FormData
        const formData = new FormData();
        formData.append('image', imagenSeleccionada);
        if (nuevoMensaje.trim()) {
          formData.append('mensaje', nuevoMensaje);
        }
        formData.append('esAdmin', 'true');
        
        response = await fetch(`/api/personalizacion/pedidos/${pedidoId}/mensajes/image`, {
          method: 'POST',
          body: formData
        });
      } else {
        // Enviar solo texto
        response = await fetch(`/api/personalizacion/pedidos/${pedidoId}/mensajes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pedidoId: pedidoId,
            mensaje: nuevoMensaje,
            esAdmin: true
          })
        });
      }

      if (response.ok) {
        const nuevoMensajeData = await response.json();
        setMensajes(prevMensajes => [...(prevMensajes || []), nuevoMensajeData]);
        setNuevoMensaje('');
        eliminarImagen();
        showToast('✅ Mensaje enviado correctamente', 'success');
      } else {
        showToast('Error al enviar el mensaje', 'error');
      }
      
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      showToast('Error de conexión. Verifica tu conexión a internet.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando conversación...</div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Pedido no encontrado</h2>
          <Link href="/admin/mensajeria" className={styles.backBtn}>
            ← Volver a Mensajería
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/mensajeria" className={styles.backBtn}>
          ← Volver a Mensajería
        </Link>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Conversación con {pedido.userName}</h1>
          <p className={styles.subtitle}>Pedido #{pedido.id.slice(-6)} | {pedido.userEmail}</p>
        </div>
        <Link href={`/admin/pedidos-personalizados/${pedido.id}`} className={styles.verPedidoBtn}>
          📋 Ver Detalles del Pedido
        </Link>
      </div>

      <div className={styles.content}>
        <div className={styles.infoPanel}>
          <h3>📦 Información del Pedido</h3>
          <div className={styles.infoPanelContent}>
            <div className={styles.infoItem}>
              <strong>Estado:</strong>
              <span className={styles.estadoBadge}>{pedido.estado}</span>
            </div>
            <div className={styles.infoItem}>
              <strong>Diseño:</strong>
              <span>{pedido.disenoPropio ? '🎨 Propio' : '📋 Base'}</span>
            </div>
            <div className={styles.infoItem}>
              <strong>Telas:</strong>
              <span>{pedido.telasSeleccionadas?.length || 0} seleccionadas</span>
            </div>
          </div>
        </div>

        <div className={styles.mensajesContainer}>
          {!mensajes || mensajes.length === 0 ? (
            <div className={styles.sinMensajes}>
              <p>🗨️ No hay mensajes aún</p>
              <p className={styles.hint}>Inicia la conversación con el cliente</p>
            </div>
          ) : (
            <div className={styles.mensajesList}>
              {mensajes.map((mensaje, index) => (
                <div
                  key={`${mensaje.id}-${index}`}
                  className={`${styles.mensaje} ${mensaje.esAdmin ? styles.mensajeAdmin : styles.mensajeCliente}`}
                >
                  {mensaje.cambioEstado && (
                    <div className={styles.cambioEstadoBadge}>
                      🔔 Cambio de estado: {mensaje.cambioEstado.estadoAnterior} → {mensaje.cambioEstado.estadoNuevo}
                    </div>
                  )}
                  <div className={styles.mensajeHeader}>
                    <span className={styles.mensajeAutor}>
                      {mensaje.esAdmin ? '🏢 Tú (Admin)' : '👤 ' + pedido.userName}
                    </span>
                    <span className={styles.mensajeFecha}>
                      {new Date(mensaje.fecha).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {mensaje.imagenUrl && (
                    <div className={styles.mensajeImagen}>
                      <img src={mensaje.imagenUrl} alt="Imagen adjunta" />
                    </div>
                  )}
                  {mensaje.mensaje && <div className={styles.mensajeTexto}>{mensaje.mensaje}</div>}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {imagenPreview && (
          <div className={styles.previewImagen}>
            <img src={imagenPreview} alt="Preview" />
            <button onClick={eliminarImagen} className={styles.btnEliminarImagen}>✕</button>
          </div>
        )}

        <form onSubmit={enviarMensaje} className={styles.formulario}>
          <textarea
            value={nuevoMensaje}
            onChange={(e) => setNuevoMensaje(e.target.value)}
            placeholder="Escribe tu respuesta al cliente..."
            className={styles.textarea}
            rows={3}
            disabled={enviando}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviarMensaje(e);
              }
            }}
          />
          <div className={styles.botonesContainer}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={seleccionarArchivo}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={abrirCamara}
              className={styles.btnIcono}
              title="Tomar foto"
              disabled={enviando}
            >
              📷
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={styles.btnIcono}
              title="Adjuntar imagen"
              disabled={enviando}
            >
              📎
            </button>
            <button 
              type="submit" 
              className={styles.btnEnviar}
              disabled={(!nuevoMensaje.trim() && !imagenSeleccionada) || enviando}
            >
              {enviando ? 'Enviando...' : '📤'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal Cámara */}
      {mostrarCamara && (
        <div className={styles.modalCamara}>
          <div className={styles.modalContent}>
            <video ref={videoRef} autoPlay playsInline className={styles.video} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className={styles.botonesCamera}>
              <button onClick={capturarFoto} className={styles.btnCapturar}>📸 Capturar</button>
              <button onClick={cerrarCamara} className={styles.btnCerrar}>✕ Cerrar</button>
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
