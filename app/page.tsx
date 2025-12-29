// Página principal - muestra la bienvenida y enlace al catálogo
import Link from 'next/link'
import styles from './page.module.css'
import CarruselHome from '@/components/CarruselHome'

export default function Home() {
  return (
    // Contenedor principal tipo "hero" - sección de bienvenida
    <main className={styles.hero}>
      
      {/* Carrusel de imágenes */}
      <CarruselHome />
      
      {/* Título principal de bienvenida */}
      <h1 className={styles.title}>
        Datsusara
      </h1>

      {/* Banner de envíos - información destacada sobre envíos */}
      <div className={styles.shippingBanner}>
        <p className={styles.shippingText}>
          📦 Hacemos envíos a todo el país
        </p>
        <Link href="/calcular-envio" className={styles.shippingLink}>
          Calcular costo de envío
        </Link>
      </div>

      {/* Subtítulo descriptivo */}
      <p className={styles.subtitle}>
        Piezas únicas hechas a mano con amor y dedicación. 
        Cada producto cuenta una historia de trabajo artesanal 
        y pasión por los detalles.
      </p>

      {/* Botón que lleva a la página de productos */}
      <Link href="/productos" className={styles.button}>
        Ver Todos los Productos
      </Link>

      {/* Sección de categorías */}
      <div className={styles.categoriesSection}>
        <h2 className={styles.categoriesTitle}>Explorar por Categoría</h2>
        
        <div className={styles.categoriesGrid}>
          
          {/* Tarjeta de Carteras */}
          <Link href="/productos?categoria=carteras" className={styles.categoryCard}>
            <div className={styles.categoryOverlay}>
              <h3 className={styles.categoryName}>Carteras</h3>
            </div>
          </Link>

          {/* Tarjeta de Riñoneras */}
          <Link href="/productos?categoria=rinoneras" className={styles.categoryCard}>
            <div className={styles.categoryOverlay}>
              <h3 className={styles.categoryName}>Riñoneras</h3>
            </div>
          </Link>

          {/* Tarjeta de Materas */}
          <Link href="/productos?categoria=materas" className={styles.categoryCard}>
            <div className={styles.categoryOverlay}>
              <h3 className={styles.categoryName}>Materas</h3>
            </div>
          </Link>

          {/* Tarjeta de Combos */}
          <Link href="/productos?categoria=combos" className={styles.categoryCard}>
            <div className={styles.categoryOverlay}>
              <h3 className={styles.categoryName}>Combos</h3>
            </div>
          </Link>

          {/* Tarjeta de Mochilas */}
          <Link href="/productos?categoria=mochilas" className={styles.categoryCard}>
            <div className={styles.categoryOverlay}>
              <h3 className={styles.categoryName}>Mochilas</h3>
            </div>
          </Link>

          {/* Tarjeta de Neceser Pileta */}
          <Link href="/productos?categoria=neceser_pileta" className={styles.categoryCard}>
            <div className={styles.categoryOverlay}>
              <h3 className={styles.categoryName}>Neceser Pileta</h3>
            </div>
          </Link>

          {/* Tarjeta de Neceser Higiene */}
          <Link href="/productos?categoria=neceser_higiene" className={styles.categoryCard}>
            <div className={styles.categoryOverlay}>
              <h3 className={styles.categoryName}>Neceser Higiene</h3>
            </div>
          </Link>

          {/* Tarjeta de Mantel Camping */}
          <Link href="/productos?categoria=mantel_camping" className={styles.categoryCard}>
            <div className={styles.categoryOverlay}>
              <h3 className={styles.categoryName}>Mantel Camping</h3>
            </div>
          </Link>

          {/* Tarjeta de Bolso Camping */}
          <Link href="/productos?categoria=bolso_camping" className={styles.categoryCard}>
            <div className={styles.categoryOverlay}>
              <h3 className={styles.categoryName}>Bolso Camping</h3>
            </div>
          </Link>

          {/* Tarjeta de Lonchera Térmica */}
          <Link href="/productos?categoria=lonchera_termica" className={styles.categoryCard}>
            <div className={styles.categoryOverlay}>
              <h3 className={styles.categoryName}>Lonchera Térmica</h3>
            </div>
          </Link>

          {/* Tarjeta de Mochilas Pequeñas */}
          <Link href="/productos?categoria=mochilas_pequenas" className={styles.categoryCard}>
            <div className={styles.categoryOverlay}>
              <h3 className={styles.categoryName}>Mochilas Pequeñas</h3>
            </div>
          </Link>

          {/* Tarjeta de Kit Dormir */}
          <Link href="/productos?categoria=kit_dormir" className={styles.categoryCard}>
            <div className={styles.categoryOverlay}>
              <h3 className={styles.categoryName}>Kit Dormir</h3>
            </div>
          </Link>

          {/* Tarjeta de Otros */}
          <Link href="/productos?categoria=otros" className={styles.categoryCard}>
            <div className={styles.categoryOverlay}>
              <h3 className={styles.categoryName}>Otros</h3>
            </div>
          </Link>

        </div>
      </div>

    </main>
  )
}
