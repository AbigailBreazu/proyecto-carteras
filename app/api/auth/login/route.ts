// API endpoint para login con JWT
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { usersDb } from '@/lib/users-db'
import { generateToken } from '@/lib/jwt'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validar campos
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Buscar usuario por email
    const user = await usersDb.findByEmail(email)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password)
    
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    // Generar JWT token
    const access_token = generateToken(user)

    // Retornar usuario sin la contraseña pero CON el rol
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      message: 'Login exitoso',
      access_token,
      user: {
        ...userWithoutPassword,
        role: user.role // Asegurar que el rol se incluye en la respuesta
      }
    })

  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    )
  }
}
