'use client'

import { useState } from 'react'
import Image from 'next/image'
import styles from './ProductCarousel.module.css'

interface ProductCarouselProps {
  images: string[]
  productName: string
}

export default function ProductCarousel({ images, productName }: ProductCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Si no hay imágenes o solo hay una imagen
  if (!images || images.length === 0) {
    return (
      <div className={styles.singleImage}>
        <Image
          src="https://via.placeholder.com/400x400/8B4513/ffffff?text=Sin+Imagen"
          alt={productName}
          width={400}
          height={400}
          unoptimized
        />
      </div>
    )
  }

  if (images.length === 1) {
    return (
      <div className={styles.singleImage}>
        <Image
          src={images[0]}
          alt={productName}
          width={400}
          height={400}
          unoptimized
        />
      </div>
    )
  }

  // Funciones de navegación
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    )
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    )
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  // Manejo de teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrevious()
    if (e.key === 'ArrowRight') goToNext()
  }

  return (
    <div className={styles.carousel} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Imagen principal */}
      <div className={styles.mainImageContainer}>
        <Image
          src={images[currentIndex]}
          alt={`${productName} - Imagen ${currentIndex + 1}`}
          fill
          className={styles.mainImage}
          unoptimized
          priority={currentIndex === 0}
        />

        {/* Botones de navegación */}
        <button
          className={`${styles.navigationButton} ${styles.prevButton}`}
          onClick={goToPrevious}
          aria-label="Imagen anterior"
        >
          ‹
        </button>

        <button
          className={`${styles.navigationButton} ${styles.nextButton}`}
          onClick={goToNext}
          aria-label="Siguiente imagen"
        >
          ›
        </button>

        {/* Contador de imágenes */}
        <div className={styles.imageCounter}>
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Miniaturas */}
      <div className={styles.thumbnailsContainer}>
        {images.map((image, index) => (
          <div
            key={index}
            className={`${styles.thumbnail} ${
              index === currentIndex ? styles.active : ''
            }`}
            onClick={() => goToSlide(index)}
          >
            <Image
              src={image}
              alt={`${productName} - Miniatura ${index + 1}`}
              width={80}
              height={80}
              className={styles.thumbnailImage}
              unoptimized
            />
          </div>
        ))}
      </div>

      {/* Indicadores de puntos */}
      <div className={styles.indicators}>
        {images.map((_, index) => (
          <button
            key={index}
            className={`${styles.indicator} ${
              index === currentIndex ? styles.active : ''
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Ir a imagen ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
