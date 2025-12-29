// Página de productos - muestra el catálogo de carteras, maters y mochilas
// Soporta filtrado por categoría mediante query params
'use client'
import { useSearchParams } from 'next/navigation'
import Card from '@/components/card'

export default function ProductosPage() {
  // Obtener el parámetro de categoría de la URL
  const searchParams = useSearchParams()
  const categoria = searchParams.get('categoria')

  return (
    // El componente Card recibe la categoría para filtrar
    <Card categoria={categoria} />
  )
}
