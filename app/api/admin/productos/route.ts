// API para gestionar productos (solo admins)
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { productosDb } from '@/lib/productos-db'

// GET - Obtener todos los productos
export async function GET() {
  try {
    const productos = productosDb.getAll()
    return NextResponse.json({ productos })
  } catch (error) {
    console.error('Error al obtener productos:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo producto (solo admins)
export async function POST(request: Request) {
  try {
    // Verificar que el usuario esté autenticado
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Por ahora permitir a cualquier usuario logueado
    // TODO: Descomentar cuando el sistema de roles esté listo
    // if (session.user.role !== 'admin') {
    //   return NextResponse.json(
    //     { error: 'Solo administradores pueden crear productos' },
    //     { status: 403 }
    //   )
    // }

    const body = await request.json()
    const { nombre, tipo, tamaño, imagen, descripcion, precio } = body

    // Validar campos
    if (!nombre || !tipo || !tamaño || !imagen || !descripcion || precio === undefined) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      )
    }

    if (precio <= 0) {
      return NextResponse.json(
        { error: 'El precio debe ser mayor a 0' },
        { status: 400 }
      )
    }

    // Crear producto
    const nuevoProducto = productosDb.create({
      nombre,
      tipo,
      tamaño,
      imagen,
      descripcion,
      precio: Number(precio)
    })

    return NextResponse.json({ 
      message: 'Producto creado exitosamente',
      producto: nuevoProducto 
    }, { status: 201 })

  } catch (error) {
    console.error('Error al crear producto:', error)
    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}
