// Configuración de NextAuth para manejar autenticación
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import type { NextAuthOptions } from "next-auth"

export const authOptions: NextAuthOptions = {
  // Configuración de providers (métodos de login)
  providers: [
    // Provider de credenciales (email/contraseña)
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        console.log('🔐 Iniciando authorize con:', { email: credentials?.email })
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Credenciales faltantes')
          return null
        }

        try {
          // Conectar con backend NestJS
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'
          console.log('🌐 Backend URL:', backendUrl)
          
          const res = await fetch(`${backendUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          console.log('📡 Response status login:', res.status)
          const data = await res.json()
          console.log('📦 Response data login:', { 
            hasToken: !!data.token,
            hasUser: !!data.user,
            keys: Object.keys(data)
          })
          
          if (res.ok && data.token && data.user) {
            // El backend devuelve el usuario directamente en la respuesta
            console.log('✅ Login exitoso, usuario:', data.user)
            
            return {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              accessToken: data.token // ← Cambiado de "token" a "accessToken"
            }
          }
          
          console.log('❌ Login falló - no hay token o user en la respuesta')
          return null
        } catch (error) {
          console.error('💥 Error en authorize:', error)
          return null
        }
      }
    }),
    
    // Provider de Google (para login con Google)
    // Necesita configuración de Google Cloud Console
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],

  // Páginas personalizadas
  pages: {
    signIn: '/login',  // Página de login personalizada
  },

  // Callbacks para personalizar el comportamiento
  callbacks: {
    // Se ejecuta cuando se crea el JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.phone = user.phone
        token.role = user.role
        token.accessToken = (user as any).accessToken // Token del backend
      }
      return token
    },
    
    // Se ejecuta cuando se accede a la sesión
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.phone = token.phone as string
        session.user.role = token.role as 'user' | 'admin'
        ;(session as any).accessToken = token.accessToken // Token del backend
      }
      return session
    },

    // Redirigir según el rol después del login
    async redirect({ url, baseUrl }) {
      // Si está en la página de login y se autenticó
      if (url.startsWith(baseUrl)) {
        return url
      }
      return baseUrl
    },
  },

  // Configuración de sesión
  session: {
    strategy: "jwt", // Usar JWT en lugar de base de datos
  },

  // Secret para firmar tokens (debe estar en .env)
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
