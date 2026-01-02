'use client'
import { useCart } from "@/contexts/CartContext"
import ProductCarousel from "./ProductCarousel"
import Link from "next/link"
import styles from "./card.module.css"
import { useState, useEffect } from "react"

// Interfaz para las props del componente
interface CardProps {
  categoria?: string | null; // Categoría para filtrar (opcional)
}

interface Product {
  id: string
  nombre: string
  tipo?: string // Opcional para compatibilidad
  categoria?: string // Campo del backend
  tamaño?: string
  imagen?: string // Campo del backend (singular)
  imagenes?: string[] // Campo esperado (plural)
  descripcion: string
  precio: number
  stock: number
}

const Card = ({ categoria }: CardProps) => {
    const { addToCart } = useCart()
    const [addedProductId, setAddedProductId] = useState<string | null>(null)
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 15

    // Cargar productos del backend
    useEffect(() => {
      const fetchProducts = async () => {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
          const res = await fetch(`${backendUrl}/api/productos`)
          const data = await res.json()
          
          console.log('📡 Respuesta completa del backend:', data);
          
          // Manejar estructura anidada del backend: { productos: { productos: [...] } }
          if (res.ok && data.productos) {
            const productosArray = Array.isArray(data.productos) 
              ? data.productos 
              : data.productos.productos || []
            console.log('📦 Productos cargados (completos):', productosArray)
            console.log('📦 Productos cargados (resumen):', productosArray.map((p: any) => ({ 
              nombre: p.nombre, 
              tipo: p.tipo,
              categoria: p.categoria,
              allKeys: Object.keys(p)
            })))
            setProducts(productosArray)
          } else {
            setError('Error al cargar productos')
          }
        } catch (err) {
          console.error('Error fetching products:', err)
          setError('Error de conexión')
        } finally {
          setLoading(false)
        }
      }

      fetchProducts()
    }, [])

    // Resetear página cuando cambia la categoría
    useEffect(() => {
      setCurrentPage(1)
    }, [categoria])

    const handleAddToCart = (product: any) => {
      // Asegurar que el producto tenga todos los campos necesarios
      const productToAdd = {
        id: product.id,
        nombre: product.nombre,
        precio: product.precio,
        imagen: product.imagen || (product.imagenes && product.imagenes[0]) || '',
        descripcion: product.descripcion || '',
        stock: product.stock || 0,
        categoria: product.categoria || product.tipo || '',
        quantity: 1
      }
      
      console.log('🛒 Agregando al carrito:', productToAdd)
      addToCart(productToAdd)
      setAddedProductId(product.id)
      setTimeout(() => setAddedProductId(null), 2000)
    }

    // Filtrar productos según la categoría seleccionada
    console.log('🔎 Filtrando con categoría:', categoria);
    console.log('🔎 Total productos antes de filtrar:', products.length);
    
    const productosFiltrados = categoria 
      ? products.filter(product => {
          // Usar el campo que exista: tipo o categoria
          const categoriaProducto = (product.tipo || product.categoria || '').toLowerCase();
          
          if (!categoriaProducto) {
            console.log('⚠️ Producto sin tipo/categoria:', product.nombre);
            return false;
          }
          
          const categoriaFiltro = categoria.toLowerCase();
          
          console.log('🔍 Comparando:', { categoriaProducto, categoriaFiltro, producto: product.nombre });
          
          // Mapeo de categorías - soportar tanto singular como plural
          if (categoriaFiltro === 'carteras' || categoriaFiltro === 'cartera') {
            const match = categoriaProducto === 'cartera' || categoriaProducto === 'carteras';
            console.log(`  → Match para carteras: ${match}`);
            return match;
          }
          if (categoriaFiltro === 'rinoneras' || categoriaFiltro === 'rinonera') {
            return categoriaProducto === 'rinonera' || categoriaProducto === 'rinoneras';
          }
          if (categoriaFiltro === 'materas' || categoriaFiltro === 'matera') {
            return categoriaProducto === 'matera' || categoriaProducto === 'materas';
          }
          if (categoriaFiltro === 'combos' || categoriaFiltro === 'combo') {
            return categoriaProducto === 'combo' || categoriaProducto === 'combos';
          }
          if (categoriaFiltro === 'mochilas' || categoriaFiltro === 'mochila') {
            return categoriaProducto === 'mochila' || categoriaProducto === 'mochilas';
          }
          if (categoriaFiltro === 'neceser_pileta') return categoriaProducto === 'neceser_pileta';
          if (categoriaFiltro === 'neceser_higiene') return categoriaProducto === 'neceser_higiene';
          if (categoriaFiltro === 'mantel_camping') return categoriaProducto === 'mantel_camping';
          if (categoriaFiltro === 'bolso_camping') return categoriaProducto === 'bolso_camping';
          if (categoriaFiltro === 'lonchera_termica') return categoriaProducto === 'lonchera_termica';
          if (categoriaFiltro === 'mochilas_pequenas') return categoriaProducto === 'mochilas_pequenas';
          if (categoriaFiltro === 'kit_dormir') return categoriaProducto === 'kit_dormir';
          if (categoriaFiltro === 'otros') return categoriaProducto === 'otros';
          
          console.log(`  → Sin match para ninguna categoría`);
          return false;
        })
      : products; // Si no hay categoría, mostrar todos
    
    console.log('📦 Productos filtrados:', productosFiltrados.length, 'de', products.length);

    // Título dinámico según la categoría
    const getTitulo = () => {
      if (!categoria) return 'Todos los Productos';
      
      const titulos: { [key: string]: string } = {
        'carteras': 'Carteras',
        'rinoneras': 'Riñoneras',
        'materas': 'Materas',
        'combos': 'Combos',
        'mochilas': 'Mochilas',
        'neceser_pileta': 'Neceser Pileta',
        'neceser_higiene': 'Neceser Higiene',
        'mantel_camping': 'Mantel Camping',
        'bolso_camping': 'Bolso Camping',
        'lonchera_termica': 'Lonchera Térmica',
        'mochilas_pequenas': 'Mochilas Pequeñas',
        'kit_dormir': 'Kit Dormir',
        'otros': 'Otros'
      };
      
      return titulos[categoria.toLowerCase()] || 'Productos';
    };

    // Calcular paginación
    const totalPages = Math.ceil(productosFiltrados.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const productosPaginados = productosFiltrados.slice(startIndex, endIndex)

    const handlePageChange = (page: number) => {
      setCurrentPage(page)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const renderPaginacion = () => {
      if (totalPages <= 1) return null

      const pages = []
      const maxVisiblePages = 5

      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1)
      }

      // Botón anterior
      if (currentPage > 1) {
        pages.push(
          <button
            key="prev"
            onClick={() => handlePageChange(currentPage - 1)}
            className={styles.paginationButton}
          >
            ‹
          </button>
        )
      }

      // Primera página
      if (startPage > 1) {
        pages.push(
          <button
            key={1}
            onClick={() => handlePageChange(1)}
            className={styles.paginationButton}
          >
            1
          </button>
        )
        if (startPage > 2) {
          pages.push(<span key="dots1" className={styles.paginationDots}>...</span>)
        }
      }

      // Páginas del rango
      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => handlePageChange(i)}
            className={`${styles.paginationButton} ${currentPage === i ? styles.paginationActive : ''}`}
          >
            {i}
          </button>
        )
      }

      // Última página
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
          pages.push(<span key="dots2" className={styles.paginationDots}>...</span>)
        }
        pages.push(
          <button
            key={totalPages}
            onClick={() => handlePageChange(totalPages)}
            className={styles.paginationButton}
          >
            {totalPages}
          </button>
        )
      }

      // Botón siguiente
      if (currentPage < totalPages) {
        pages.push(
          <button
            key="next"
            onClick={() => handlePageChange(currentPage + 1)}
            className={styles.paginationButton}
          >
            ›
          </button>
        )
      }

      return <div className={styles.pagination}>{pages}</div>
    }

    return (
      <div className={styles.container}>
        {/* Título dinámico según la categoría */}
        <h1 className={styles.title}>{getTitulo()}</h1>

        {/* Mostrar loading */}
        {loading && (
          <p className={styles.loading}>Cargando productos...</p>
        )}

        {/* Mostrar error */}
        {error && (
          <p className={styles.error}>{error}</p>
        )}

        {/* Mostrar mensaje si no hay productos */}
        {!loading && !error && productosFiltrados.length === 0 ? (
          <p className={styles.noProducts}>
            No hay productos en esta categoría por el momento.
          </p>
        ) : (
          <>
            <div className={styles.grid}>
              {productosPaginados.map((product) => {
                // Usar el array de imágenes si existe, sino usar la imagen principal
                const productImages = product.imagenes && product.imagenes.length > 0 
                  ? product.imagenes 
                  : [product.imagen];

                return (
                  <div key={product.id} className={styles.card}>
                    <Link href={`/productos/${product.id}`} className={styles.cardLink}>
                      <div className={styles.carouselWrapper}>
                        <ProductCarousel 
                          images={productImages} 
                          productName={product.nombre}
                        />
                      </div>
                      <h2 className={styles.cardTitle}>{product.nombre}</h2>
                      <p className={styles.description}>{product.descripcion}</p>
                    </Link>
                  <div className={styles.cardFooter}>
                    <p className={styles.price}>${product.precio.toLocaleString('es-AR')}</p>
                    <button 
                      className={`${styles.addButton} ${addedProductId === product.id ? styles.added : ''}`}
                      onClick={() => handleAddToCart(product)}
                    >
                      {addedProductId === product.id ? '✓ Agregado' : 'Agregar al carrito'}
                    </button>
                  </div>
                </div>
              );
              })}
            </div>

            {/* Paginación */}
            {renderPaginacion()}
          </>
        )}
      </div>
    );
}

export default Card;