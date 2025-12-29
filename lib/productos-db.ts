// Almacenamiento temporal de productos (por ahora en memoria)
// Después esto se migrará a una base de datos real

import { IProduct } from '@/types/product'

// Array temporal para almacenar productos (se pierde al reiniciar el servidor)
// En producción, esto debe estar en una base de datos
let productos: IProduct[] = []

export const productosDb = {
  // Obtener todos los productos
  getAll: () => productos,
  
  // Buscar producto por ID
  findById: (id: string) => {
    return productos.find(producto => producto.id === id)
  },
  
  // Buscar productos por tipo
  findByTipo: (tipo: string) => {
    return productos.filter(producto => producto.tipo.toLowerCase() === tipo.toLowerCase())
  },
  
  // Crear nuevo producto
  create: (productoData: Omit<IProduct, 'id'>) => {
    const newProducto: IProduct = {
      ...productoData,
      id: Date.now().toString(), // ID simple (en BD real usarías UUID)
    }
    productos.push(newProducto)
    return newProducto
  },
  
  // Actualizar producto
  update: (id: string, productoData: Partial<Omit<IProduct, 'id'>>) => {
    const index = productos.findIndex(p => p.id === id)
    if (index !== -1) {
      productos[index] = { ...productos[index], ...productoData }
      return productos[index]
    }
    return null
  },
  
  // Eliminar producto
  delete: (id: string) => {
    const index = productos.findIndex(p => p.id === id)
    if (index !== -1) {
      const deleted = productos[index]
      productos.splice(index, 1)
      return deleted
    }
    return null
  },
  
  // Limpiar todos los productos (para testing)
  clear: () => {
    productos = []
  }
}
