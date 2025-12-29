// API endpoint para listar todos los usuarios (solo admin)
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/jwt'
import { usersDb } from '@/lib/users-db'

export async function GET(request: Request) {
  try {
    // Verificar que el usuario sea admin
    const { authorized, user } = requireAdmin(request)

    if (!authorized) {
      return NextResponse.json(
        { error: user ? 'Acceso denegado. Requiere rol de administrador.' : 'No autorizado. Token inválido o expirado.' },
        { status: user ? 403 : 401 }
      )
    }

    // Obtener todos los usuarios
    const allUsers = usersDb.getAll()

    // Remover contraseñas de los usuarios
    const usersWithoutPasswords = allUsers.map(u => {
      const { password, ...userWithoutPassword } = u
      return userWithoutPassword
    })

    return NextResponse.json({
      message: 'Usuarios obtenidos exitosamente',
      users: usersWithoutPasswords
    })

  } catch (error) {
    console.error('Error en /users:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}
