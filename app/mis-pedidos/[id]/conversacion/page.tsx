'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import styles from './conversacion.module.css';

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
};

export default function ConversacionPage() {
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
  const [imagenSeleccionada, setImagenSeleccionada] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(null);
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!session) {
      router.push('/login');
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
        
        // Marcar mensajes del admin como leídos por el cliente
        const mensajesAdminNoLeidos = mensajesUnicos.filter((m: Mensaje) => m.esAdmin && !m.leido);
        if (mensajesAdminNoLeidos.length > 0) {
          await marcarMensajesComoLeidos(mensajesAdminNoLeidos.map((m: Mensaje) => m.id));
          // Actualizar el estado local inmediatamente
          setMensajes(prev => prev.map(m => 
            mensajesAdminNoLeidos.find(ma => ma.id === m.id) ? { ...m, leido: true } : m
          ));
        }
      }
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  const marcarMensajesComoLeidos = async (mensajeIds: string[]) => {
    try {
      const response = await fetch(`/api/personalizacion/pedidos/${pedidoId}/mensajes/marcar-leidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensajeIds })
      });
      
      if (response.ok) {
        window.dispatchEvent(new Event('mensajesLeidos'));
      }
    } catch (error) {
      console.error('Error al marcar mensajes como leídos:', error);
    }
  };

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!nuevoMensaje.trim() && !imagenSeleccionada) || enviando) return;

    setEnviando(true);

    try {
      let response;

      // Si hay imagen, usar multipart/form-data
      if (imagenSeleccionada) {
        const formData = new FormData();
        formData.append('image', imagenSeleccionada);
        if (nuevoMensaje.trim()) {
          formData.append('mensaje', nuevoMensaje);
        }

        response = await fetch(`/api/personalizacion/pedidos/${pedidoId}/mensajes/image`, {
          method: 'POST',
          body: formData
        });
      } else {
        // Si solo es texto, usar JSON
        response = await fetch(`/api/personalizacion/pedidos/${pedidoId}/mensajes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pedidoId: pedidoId,
            mensaje: nuevoMensaje,
            esAdmin: false
          })
        });
      }

      if (response.ok) {
        const nuevoMensajeData = await response.json();
        setMensajes([...mensajes, nuevoMensajeData]);
        setNuevoMensaje('');
        setImagenSeleccionada(null);
        setImagenPreview(null);
        showToast('✅ Mensaje enviado correctamente', 'success');
        await cargarMensajes(); // Recargar para actualizar
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

  const abrirCamara = async () => {
    try {
      setMostrarCamara(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      showToast('No se pudo acceder a la cámara', 'error');
      setMostrarCamara(false);
    }
  };

  const cerrarCamara = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setMostrarCamara(false);
  };

  const capturarFoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setImagenSeleccionada(file);
            setImagenPreview(URL.createObjectURL(file));
            cerrarCamara();
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const seleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        showToast('La imagen no puede superar 10MB', 'error');
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

  if (loading) {
    return <div className={styles.loading}>Cargando conversación...</div>;
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
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Conversación - Pedido #{pedido.id.slice(-6)}</h1>
          <p className={styles.subtitle}>Comunícate directamente con nosotros sobre tu pedido</p>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mensajesContainer}>
          {mensajes.length === 0 ? (
            <div className={styles.sinMensajes}>
              <p>🗨️ No hay mensajes aún</p>
              <p className={styles.hint}>Inicia la conversación escribiendo tu primer mensaje</p>
            </div>
          ) : (
            <div className={styles.mensajesList}>
              {mensajes.map((mensaje) => (
                <div
                  key={mensaje.id}
                  className={`${styles.mensaje} ${mensaje.esAdmin ? styles.mensajeAdmin : styles.mensajeUsuario}`}
                >
                  {mensaje.cambioEstado && (
                    <div className={styles.cambioEstadoBadge}>
                      🔔 Cambio de estado: {mensaje.cambioEstado.estadoAnterior} → {mensaje.cambioEstado.estadoNuevo}
                    </div>
                  )}
                  <div className={styles.mensajeHeader}>
                    <span className={styles.mensajeAutor}>
                      {mensaje.esAdmin ? '👤 Administrador' : '👤 Tú'}
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
                  {!mensaje.leido && !mensaje.esAdmin && (
                    <div className={styles.estadoEnviado}>✓ Enviado</div>
                  )}
                  {mensaje.leido && !mensaje.esAdmin && (
                    <div className={styles.estadoLeido}>✓✓ Leído</div>
                  )}
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
            placeholder="Escribe tu mensaje aquí..."
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
