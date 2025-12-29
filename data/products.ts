import { IProduct } from '@/types/product';

export const products: IProduct[] = [
  {
    id: '1',
    nombre: 'Cartera Clásica Elegante',
    tipo: 'cartera',
    tamaño: 'Mediana (25x15x8 cm)',
    imagen: 'https://via.placeholder.com/400x400/8B4513/ffffff?text=Cartera+1',
    imagenes: [
      'https://via.placeholder.com/400x400/8B4513/ffffff?text=Cartera+1',
      'https://via.placeholder.com/400x400/A0522D/ffffff?text=Detalle+1',
      'https://via.placeholder.com/400x400/CD853F/ffffff?text=Interior+1',
      'https://via.placeholder.com/400x400/D2691E/ffffff?text=Uso+1'
    ],
    descripcion: 'Cartera de cuero sintético elegante, perfecta para ocasiones formales. Incluye múltiples compartimentos y cierre con broche dorado.',
    precio: 4500
  },
  {
    id: '2',
    nombre: 'Cartera Crossbody Urbana',
    tipo: 'cartera',
    tamaño: 'Pequeña (20x12x6 cm)',
    imagen: 'https://via.placeholder.com/400x400/A0522D/ffffff?text=Cartera+2',
    imagenes: [
      'https://via.placeholder.com/400x400/A0522D/ffffff?text=Cartera+2',
      'https://via.placeholder.com/400x400/8B4513/ffffff?text=Lateral+2',
      'https://via.placeholder.com/400x400/CD853F/ffffff?text=Correa+2'
    ],
    descripcion: 'Cartera crossbody moderna ideal para el día a día. Correa ajustable y diseño minimalista.',
    precio: 3800
  },
  {
    id: '3',
    nombre: 'Mater Ejecutiva Premium',
    tipo: 'mater',
    tamaño: 'Grande (35x25x10 cm)',
    imagen: 'https://via.placeholder.com/400x400/CD853F/ffffff?text=Mater+1',
    imagenes: [
      'https://via.placeholder.com/400x400/CD853F/ffffff?text=Mater+1',
      'https://via.placeholder.com/400x400/D2691E/ffffff?text=Laptop+1',
      'https://via.placeholder.com/400x400/A0522D/ffffff?text=Bolsillos+1',
      'https://via.placeholder.com/400x400/8B4513/ffffff?text=Cierre+1',
      'https://via.placeholder.com/400x400/654321/ffffff?text=Uso+Mater'
    ],
    descripcion: 'Mater espaciosa con compartimento acolchado para laptop de hasta 15". Diseño profesional y elegante.',
    precio: 6200
  },
  {
    id: '4',
    nombre: 'Mater Casual Diaria',
    tipo: 'mater',
    tamaño: 'Mediana (30x20x8 cm)',
    imagen: 'https://via.placeholder.com/400x400/D2691E/ffffff?text=Mater+2',
    descripcion: 'Mater versátil para uso diario. Múltiples bolsillos internos y externos. Material resistente al agua.',
    precio: 4800
  },
  {
    id: '5',
    nombre: 'Mochila Deportiva Active',
    tipo: 'mochila',
    tamaño: 'Grande (40x30x15 cm)',
    imagen: 'https://via.placeholder.com/400x400/654321/ffffff?text=Mochila+1',
    descripcion: 'Mochila deportiva con diseño ergonómico. Tirantes acolchados y compartimento para botella de agua.',
    precio: 5500
  },
  {
    id: '6',
    nombre: 'Mochila Urbana Compacta',
    tipo: 'mochila',
    tamaño: 'Mediana (35x25x12 cm)',
    imagen: 'https://via.placeholder.com/400x400/8B7355/ffffff?text=Mochila+2',
    descripcion: 'Mochila urbana compacta con puerto USB para carga de dispositivos. Ideal para estudiantes y profesionales.',
    precio: 5200
  },
  {
    id: '7',
    nombre: 'Cartera Fiesta Dorada',
    tipo: 'cartera',
    tamaño: 'Pequeña (18x10x5 cm)',
    imagen: 'https://via.placeholder.com/400x400/DAA520/ffffff?text=Cartera+3',
    descripcion: 'Cartera de mano tipo clutch, perfecta para eventos nocturnos. Detalles metálicos dorados y cadena removible.',
    precio: 3200
  },
  {
    id: '8',
    nombre: 'Mochila Travel Adventure',
    tipo: 'mochila',
    tamaño: 'Extra Grande (45x35x20 cm)',
    imagen: 'https://via.placeholder.com/400x400/8B4513/ffffff?text=Mochila+3',
    descripcion: 'Mochila para viajes con capacidad de 35L. Sistema anti-robo y material impermeable. Perfecta para aventuras.',
    precio: 7800
  },
  {
    id: '9',
    nombre: 'Mater Shopping Tote',
    tipo: 'mater',
    tamaño: 'Grande (40x30x12 cm)',
    imagen: 'https://via.placeholder.com/400x400/BC8F8F/ffffff?text=Mater+3',
    descripcion: 'Mater tipo tote espaciosa y resistente. Ideal para compras o como bolso de playa. Disponible en varios colores.',
    precio: 3500
  },
  {
    id: '10',
    nombre: 'Cartera Mini Trendy',
    tipo: 'cartera',
    tamaño: 'Mini (15x10x8 cm)',
    imagen: 'https://via.placeholder.com/400x400/F4A460/ffffff?text=Cartera+4',
    descripcion: 'Mini cartera de moda con cadena plateada. Perfecta para llevar lo esencial con estilo.',
    precio: 2800
  }
];
