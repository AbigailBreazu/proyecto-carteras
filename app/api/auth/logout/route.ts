// API endpoint para cerrar sesión
import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/jwt'

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const user = authenticateRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado. Token inválido o expirado.' },
        { status: 401 }
      )
    }

    // En JWT, el logout se maneja en el cliente eliminando el token
    // Este endpoint solo confirma que el token era válido antes de cerrarlo
    return NextResponse.json({
      message: 'Sesión cerrada exitosamente'
    })

  } catch (error) {
    console.error('Error en /auth/logout:', error)
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}
