// Utilidades para manejar JWT (JSON Web Tokens)
import jwt from 'jsonwebtoken'
import { User } from './users-db'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production'

export interface JWTPayload {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
}

/**
 * Genera un JWT token para un usuario
 */
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  }

  // Token expira en 7 días
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * Verifica y decodifica un JWT token
 * Retorna el payload si es válido, null si no lo es
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Extrae el token del header Authorization
 * Formato esperado: "Bearer <token>"
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null
  
  return parts[1]
}

/**
 * Middleware para verificar autenticación
 * Retorna el payload del usuario si está autenticado, null si no
 */
export function authenticateRequest(request: Request): JWTPayload | null {
  const authHeader = request.headers.get('Authorization')
  const token = extractTokenFromHeader(authHeader)
  
  if (!token) return null
  
  return verifyToken(token)
}

/**
 * Middleware para verificar que el usuario sea admin
 */
export function requireAdmin(request: Request): { authorized: boolean; user: JWTPayload | null } {
  const user = authenticateRequest(request)
  
  if (!user) {
    return { authorized: false, user: null }
  }
  
  if (user.role !== 'admin') {
    return { authorized: false, user }
  }
  
  return { authorized: true, user }
}
