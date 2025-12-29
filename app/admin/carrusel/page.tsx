'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './carrusel-admin.module.css';

interface ImagenCarrusel {
  id: number;
  imagen: string;
  orden: number;
  activo: boolean;
}

export default function CarruselAdmin() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [imagenes, setImagenes] = useState<ImagenCarrusel[]>([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [modalEliminar, setModalEliminar] = useState<number | null>(null);
  const [modalLimpiar, setModalLimpiar] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/');
      } else {
        cargarImagenes();
      }
    }
  }, [status, session, router]);

  const cargarImagenes = async () => {
    try {
      console.log('Cargando imágenes del carrusel...');
      const res = await fetch('/api/carrusel');
      console.log('Respuesta de /api/carrusel:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Imágenes recibidas:', data);
        setImagenes(data.sort((a: ImagenCarrusel, b: ImagenCarrusel) => a.orden - b.orden));
      }
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
      mostrarMensaje('Error al cargar las imágenes', true);
    } finally {
      setCargando(false);
    }
  };

  const mostrarMensaje = (msg: string, esError = false) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(''), 3000);
  };

  const subirImagen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      mostrarMensaje('Por favor selecciona una imagen válida', true);
      return;
    }

    if (imagenes.length >= 12) {
      mostrarMensaje('Máximo 12 imágenes permitidas', true);
      return;
    }

    setEnviando(true);

    try {
      // Subir la imagen
      const formData = new FormData();
      formData.append('images', file);

      console.log('Subiendo imagen al servidor...');
      const uploadRes = await fetch('http://localhost:3000/upload/images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
        },
        body: formData,
      });

      console.log('Respuesta del servidor:', uploadRes.status);

      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        console.error('Error del servidor:', errorText);
        throw new Error(`Error al subir la imagen: ${uploadRes.status}`);
      }

      const uploadData = await uploadRes.json();
      console.log('Datos recibidos:', uploadData);
      
      // El backend devuelve { urls: [...] } o { files: [{url: ...}] }
      const imageUrls = uploadData.urls || uploadData.files?.map((f: any) => f.url) || [];
      console.log('URLs extraídas:', imageUrls);
      
      let url = imageUrls[0];
      
      if (!url) {
        console.error('Respuesta del servidor:', uploadData);
        throw new Error('No se recibió la URL de la imagen');
      }
      
      // Si la URL viene completa, extraer solo la ruta relativa
      if (url.startsWith('http://localhost:3000')) {
        url = url.replace('http://localhost:3000', '');
      }
      
      console.log('URL recibida del backend (ruta relativa):', url);

      // Crear entrada en el carrusel
      const nuevoOrden = imagenes.length > 0 ? Math.max(...imagenes.map(i => i.orden)) + 1 : 1;

      console.log('Creando entrada en carrusel:', { imagen: url, orden: nuevoOrden });

      const res = await fetch('/api/carrusel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify({
          imagen: url,
          orden: nuevoOrden,
          activo: true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Error al crear entrada:', errorData);
        throw new Error('Error al agregar la imagen al carrusel');
      }

      const resultData = await res.json();
      console.log('Imagen agregada al carrusel:', resultData);

      mostrarMensaje('Imagen agregada correctamente');
      await cargarImagenes();
    } catch (error) {
      console.error('Error completo:', error);
      mostrarMensaje(`Error al agregar la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`, true);
    } finally {
      setEnviando(false);
      e.target.value = '';
    }
  };

  const toggleActivo = async (id: number, activo: boolean) => {
    try {
      const res = await fetch('/api/carrusel', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
        },
        body: JSON.stringify({ id, activo: !activo }),
      });

      if (!res.ok) throw new Error('Error al actualizar');

      cargarImagenes();
      mostrarMensaje('Estado actualizado');
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al actualizar', true);
    }
  };

  const eliminarImagen = async (id: number) => {
    setModalEliminar(null);
    
    try {
      const res = await fetch(`/api/carrusel?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(session as any)?.accessToken}`,
        },
      });

      if (!res.ok) throw new Error('Error al eliminar');

      mostrarMensaje('Imagen eliminada');
      cargarImagenes();
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al eliminar la imagen', true);
    }
  };

  const limpiarImagenesRotas = async () => {
    setModalLimpiar(false);
    
    const imagenesRotas = imagenes.filter(img => img.imagen.includes('http://localhost:3000/uploads/images/http://'));
    
    setEnviando(true);
    try {
      for (const img of imagenesRotas) {
        await fetch(`/api/carrusel?id=${img.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${(session as any)?.accessToken}`,
          },
        });
      }

      mostrarMensaje(`${imagenesRotas.length} imágenes eliminadas correctamente`);
      cargarImagenes();
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al limpiar imágenes', true);
    } finally {
      setEnviando(false);
    }
  };

  if (status === 'loading' || cargando) {
    return <div className={styles.cargando}>Cargando...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Carrusel de Imágenes</h1>
        <p className={styles.info}>
          Gestiona las imágenes del carrusel de la página principal (mínimo 6, máximo 12)
        </p>
      </div>

      {mensaje && (
        <div className={`${styles.mensaje} ${mensaje.includes('Error') ? styles.error : ''}`}>
          {mensaje}
        </div>
      )}

      <div className={styles.uploadSection}>
        <label className={styles.btnUpload}>
          {enviando ? 'Subiendo...' : '+ Agregar Imagen'}
          <input
            type="file"
            accept="image/*"
            onChange={subirImagen}
            disabled={enviando || imagenes.length >= 12}
            style={{ display: 'none' }}
          />
        </label>
        <span className={styles.contador}>
          {imagenes.length} / 12 imágenes
        </span>
        {imagenes.some(img => img.imagen.includes('http://localhost:3000/uploads/images/http://')) && (
          <button 
            onClick={() => setModalLimpiar(true)}
            className={styles.btnLimpiar}
            disabled={enviando}
          >
            🧹 Limpiar URLs Duplicadas
          </button>
        )}
      </div>

      <div className={styles.grid}>
        {imagenes.map((img) => {
          console.log('Renderizando imagen:', img.id, img.imagen);
          return (
            <div key={img.id} className={styles.card}>
              <div className={styles.imagenWrapper}>
                <img 
                  src={img.imagen} 
                  alt={`Imagen ${img.orden}`}
                  onError={(e) => {
                    console.error('Error al cargar imagen:', img.imagen);
                    (e.target as HTMLImageElement).style.border = '2px solid red';
                  }}
                  onLoad={() => console.log('Imagen cargada correctamente:', img.imagen)}
                />
                {!img.activo && <div className={styles.inactivo}>INACTIVA</div>}
              </div>
              <div className={styles.acciones}>
                <span className={styles.orden}>Orden: {img.orden}</span>
                <button
                  onClick={() => toggleActivo(img.id, img.activo)}
                  className={styles.btnToggle}
                >
                  {img.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => setModalEliminar(img.id)}
                  className={styles.btnEliminar}
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {imagenes.length === 0 && (
        <div className={styles.vacio}>
          <p>No hay imágenes en el carrusel</p>
          <p>Agrega al menos 6 imágenes para que se muestre en la página principal</p>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {modalEliminar && (
        <div className={styles.modalOverlay} onClick={() => setModalEliminar(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>¿Eliminar imagen?</h3>
            <p>Esta acción no se puede deshacer.</p>
            <div className={styles.modalButtons}>
              <button onClick={() => setModalEliminar(null)} className={styles.btnCancelar}>
                Cancelar
              </button>
              <button onClick={() => eliminarImagen(modalEliminar)} className={styles.btnConfirmar}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para limpiar */}
      {modalLimpiar && (
        <div className={styles.modalOverlay} onClick={() => setModalLimpiar(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>¿Limpiar URLs duplicadas?</h3>
            <p>Se eliminarán {imagenes.filter(img => img.imagen.includes('http://localhost:3000/uploads/images/http://')).length} imágenes con URLs duplicadas.</p>
            <div className={styles.modalButtons}>
              <button onClick={() => setModalLimpiar(false)} className={styles.btnCancelar}>
                Cancelar
              </button>
              <button onClick={limpiarImagenesRotas} className={styles.btnConfirmar}>
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
