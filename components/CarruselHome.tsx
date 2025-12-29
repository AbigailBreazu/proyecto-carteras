'use client';

import { useState, useEffect } from 'react';
import styles from './carrusel-home.module.css';

interface ImagenCarrusel {
  id: number;
  imagen: string;
  orden: number;
  activo: boolean;
}

export default function CarruselHome() {
  const [imagenes, setImagenes] = useState<ImagenCarrusel[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarImagenes();
  }, []);

  const cargarImagenes = async () => {
    try {
      const res = await fetch('/api/carrusel');
      if (res.ok) {
        const data = await res.json();
        // Filtrar solo las activas y ordenar
        const activas = data.filter((img: ImagenCarrusel) => img.activo)
          .sort((a: ImagenCarrusel, b: ImagenCarrusel) => a.orden - b.orden);
        setImagenes(activas);
      }
    } catch (error) {
      console.error('Error al cargar imágenes del carrusel:', error);
    } finally {
      setCargando(false);
    }
  };

  if (cargando) {
    return <div className={styles.cargando}>Cargando carrusel...</div>;
  }

  if (imagenes.length === 0) {
    return null; // No mostrar nada si no hay imágenes
  }

  return (
    <div className={styles.carruselContainer}>
      <div className={styles.carrusel}>
        <div className={styles.scrollWrapper}>
          {/* Primera copia */}
          {imagenes.map((img) => (
            <div key={`img-1-${img.id}`} className={styles.imagenItem}>
              <img src={img.imagen} alt={`Imagen ${img.orden}`} />
            </div>
          ))}
          {/* Segunda copia para scroll infinito */}
          {imagenes.map((img) => (
            <div key={`img-2-${img.id}`} className={styles.imagenItem}>
              <img src={img.imagen} alt={`Imagen ${img.orden}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
