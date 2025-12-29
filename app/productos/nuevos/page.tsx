'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import ProductCarousel from '@/components/ProductCarousel';
import Link from 'next/link';
import { Product } from '@/types/product';
import styles from './nuevos.module.css';

export default function ProductosNuevosPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  useEffect(() => {
    cargarProductosNuevos();
  }, []);

  const cargarProductosNuevos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/productos');
      
      if (response.ok) {
        const data = await response.json();
        
        // Filtrar productos de la última semana (7 días)
        const unaSemanaAtras = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        const productosNuevos = data.productos.filter((producto: Product) => {
          // El ID es un timestamp, convertirlo a número
          const fechaCreacion = parseInt(producto.id);
          return fechaCreacion > unaSemanaAtras;
        });
        
        // Ordenar por más reciente primero
        productosNuevos.sort((a: Product, b: Product) => {
          return parseInt(b.id) - parseInt(a.id);
        });
        
        setProductos(productosNuevos);
      }
    } catch (error) {
      console.error('Error al cargar productos nuevos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (producto: Product) => {
    addToCart({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen || ''
    } as any);

    setAddedProductId(producto.id);
    setTimeout(() => {
      setAddedProductId(null);
    }, 2000);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando productos nuevos...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>✨ Productos Nuevos</h1>
        <p className={styles.subtitle}>
          Descubrí los últimos productos agregados esta semana
        </p>
      </header>

      {productos.length === 0 ? (
        <div className={styles.empty}>
          <p>No hay productos nuevos esta semana</p>
          <button onClick={() => router.push('/productos')} className={styles.backBtn}>
            Ver Todos los Productos
          </button>
        </div>
      ) : (
        <>
          <div className={styles.info}>
            {productos.length} producto{productos.length !== 1 ? 's' : ''} nuevo{productos.length !== 1 ? 's' : ''} esta semana
          </div>
          
          <div className={styles.grid}>
            {productos.map((producto) => (
              <div key={producto.id} className={styles.card}>
                <Link href={`/productos/${producto.id}`} className={styles.cardLink}>
                  {producto.imagenes && producto.imagenes.length > 0 ? (
                    <ProductCarousel images={producto.imagenes} productName={producto.nombre} />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <img 
                        src={producto.imagen || '/placeholder.jpg'} 
                        alt={producto.nombre}
                        className={styles.singleImage}
                      />
                    </div>
                  )}
                  
                  <div className={styles.cardContent}>
                    <span className={styles.badge}>✨ NUEVO</span>
                    <h3 className={styles.productName}>{producto.nombre}</h3>
                    <p className={styles.productType}>{producto.tipo}</p>
                    <p className={styles.productPrice}>${producto.precio.toLocaleString('es-AR')}</p>
                  </div>
                </Link>
                
                <button
                  onClick={() => handleAddToCart(producto)}
                  className={`${styles.addButton} ${addedProductId === producto.id ? styles.added : ''}`}
                  disabled={addedProductId === producto.id}
                >
                  {addedProductId === producto.id ? '✓ Agregado' : '🛒 Agregar al carrito'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
