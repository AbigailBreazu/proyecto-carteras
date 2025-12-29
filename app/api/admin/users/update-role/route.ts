// API para actualizar el rol de un usuario (solo admins)
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { usersDb } from '@/lib/users-db'

export async function POST(request: Request) {
  try {
    // Verificar que el usuario esté autenticado y sea admin
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, role } = body

    // Validar datos
    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId y role son requeridos' },
        { status: 400 }
      )
    }

    if (role !== 'user' && role !== 'admin') {
      return NextResponse.json(
        { error: 'Rol inválido' },
        { status: 400 }
      )
    }

    // No permitir que un admin cambie su propio rol
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes cambiar tu propio rol' },
        { status: 400 }
      )
    }

    // Actualizar rol
    const updatedUser = usersDb.updateRole(userId, role)

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const { password, ...userWithoutPassword } = updatedUser

    return NextResponse.json({ 
      message: 'Rol actualizado correctamente',
      user: userWithoutPassword 
    })

  } catch (error) {
    console.error('Error al actualizar rol:', error)
    return NextResponse.json(
      { error: 'Error al actualizar rol' },
      { status: 500 }
    )
  }
}
