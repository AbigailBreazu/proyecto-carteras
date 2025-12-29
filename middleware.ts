import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  console.log('🔐 Middleware - Token:', token ? { email: token.email, role: token.role } : 'NO TOKEN')
  
  const { pathname } = request.nextUrl

  // Si es admin y está intentando acceder a rutas de usuario común, redirigir a admin
  if (token && token.role === 'admin') {
    const rutasUsuario = ['/', '/productos', '/carrito', '/checkout', '/mi-cuenta', '/mis-pedidos', '/nosotros', '/contacto']
    if (rutasUsuario.some(ruta => pathname === ruta || pathname.startsWith(ruta + '/'))) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  // Rutas de admin - solo accesibles para administradores
  if (pathname.startsWith('/admin')) {
    if (!token) {
      // No está autenticado, redirigir al login
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    if (token.role !== 'admin') {
      // No es admin, redirigir a la página de usuario
      return NextResponse.redirect(new URL('/mi-cuenta', request.url))
    }
  }

  // Rutas de usuario - solo accesibles para usuarios autenticados
  if (pathname.startsWith('/mi-cuenta') || pathname.startsWith('/mis-pedidos')) {
    if (!token) {
      // No está autenticado, redirigir al login
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/productos/:path*', '/carrito/:path*', '/checkout/:path*', '/admin/:path*', '/mi-cuenta/:path*', '/mis-pedidos/:path*', '/nosotros/:path*', '/contacto/:path*']
}
