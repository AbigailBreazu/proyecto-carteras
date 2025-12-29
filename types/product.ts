export interface IProduct {
  id: string;
  nombre: string;
  tipo: string;
  tamaño: string;
  imagen: string;
  imagenes?: string[]; // Array de hasta 10 imágenes
  descripcion: string;
  precio: number;
  stock?: number;
  activo?: boolean;
  material?: string;
  color?: string;
}

// Alias para compatibilidad
export type Product = IProduct;
