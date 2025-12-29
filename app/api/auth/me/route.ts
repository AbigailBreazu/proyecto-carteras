// API endpoint para obtener usuario autenticado actual
import { NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/jwt'

export async function GET(request: Request) {
  try {
    // Verificar autenticación
    const user = authenticateRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado. Token inválido o expirado.' },
        { status: 401 }
      )
    }

    // Retornar información del usuario autenticado
    return NextResponse.json({
      message: 'Usuario autenticado',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Error en /auth/me:', error)
    return NextResponse.json(
      { error: 'Error al obtener información del usuario' },
      { status: 500 }
    )
  }
}
