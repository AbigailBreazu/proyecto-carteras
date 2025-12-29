// API endpoint para registrar nuevos usuarios con JWT
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { usersDb } from '@/lib/users-db'
import { generateToken } from '@/lib/jwt'

export async function POST(request: Request) {
  try {
    // Obtener datos del cuerpo de la petición
    const body = await request.json()
    const { name, email, phone, password, confirmPassword } = body

    // Validar que todos los campos estén presentes
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validar que las contraseñas coincidan (si se proporciona confirmPassword)
    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Las contraseñas no coinciden' },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe
    const existingUser = await usersDb.findByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear el usuario
    const newUser = await usersDb.create({
      name,
      email,
      phone,
      password: hashedPassword,
    })

    // Generar JWT token
    const access_token = generateToken(newUser)

    // Retornar usuario sin la contraseña
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json(
      { 
        message: 'Usuario registrado exitosamente',
        access_token,
        user: userWithoutPassword 
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error en registro:', error)
    return NextResponse.json(
      { error: 'Error al registrar usuario' },
      { status: 500 }
    )
  }
}
