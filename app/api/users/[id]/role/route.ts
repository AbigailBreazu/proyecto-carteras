// API endpoint para cambiar rol de un usuario (solo admin)
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/jwt'
import { usersDb } from '@/lib/users-db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar que el usuario sea admin
    const { authorized, user } = requireAdmin(request)

    if (!authorized) {
      return NextResponse.json(
        { error: user ? 'Acceso denegado. Requiere rol de administrador.' : 'No autorizado. Token inválido o expirado.' },
        { status: user ? 403 : 401 }
      )
    }

    // Obtener el ID del usuario a actualizar
    const { id } = await params
    const body = await request.json()
    const { role } = body

    // Validar que se proporcione un rol
    if (!role) {
      return NextResponse.json(
        { error: 'El campo "role" es requerido' },
        { status: 400 }
      )
    }

    // Validar que el rol sea válido
    if (role !== 'user' && role !== 'admin') {
      return NextResponse.json(
        { error: 'Rol inválido. Debe ser "user" o "admin"' },
        { status: 400 }
      )
    }

    // Buscar el usuario
    const targetUser = usersDb.findById(id)
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Actualizar el rol
    const updatedUser = usersDb.updateRole(id, role)

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Error al actualizar el rol' },
        { status: 500 }
      )
    }

    // Retornar usuario sin contraseña
    const { password: _, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      message: 'Rol actualizado exitosamente',
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Error en /users/:id/role:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el rol del usuario' },
      { status: 500 }
    )
  }
}
