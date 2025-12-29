// Tipos extendidos para NextAuth
import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    name: string
    email: string
    phone?: string
    role: 'user' | 'admin'
    accessToken?: string
  }

  interface Session {
    user: {
      id: string
      name: string
      email: string
      phone?: string
      role: 'user' | 'admin'
    }
    accessToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    name: string
    phone?: string
    role: 'user' | 'admin'
    accessToken?: string
  }
}
